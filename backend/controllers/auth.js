// sendOtp , signup , login ,  changePassword
const User = require('./../models/user');
const Profile = require('./../models/profile');
const optGenerator = require('otp-generator');
const OTP = require('../models/OTP');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const cookie = require('cookie');
const mailSender = require('../utils/mailSender');
const otpTemplate = require('../mail/templates/emailVerificationTemplate');
const {
  passwordUpdated
} = require("../mail/templates/passwordUpdate");
const {
  createNewUserRegistrationNotification
} = require('./notification');
const {
  OAuth2Client
} = require('google-auth-library');
const axios = require('axios');
const getSSOSecret = () => {
  if (!process.env.SSO_SECRET) throw new Error('SSO integration is not configured');
  return process.env.SSO_SECRET;
};
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ================ SEND-OTP For Email Verification ================
exports.sendOTP = async (req, res) => {
  try {
    // fetch email from req.body 
    const {
      email
    } = req.body;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // check if user already exists
    const checkUserPresent = await User.findOne({
      email
    });
    if (checkUserPresent) {
      return res.status(401).json({
        success: false,
        message: 'User is Already Registered'
      });
    }

    // generate OTP
    const otp = optGenerator.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false
    });

    // Extract name from email for personalization
    const name = email.split('@')[0].split('.').map(part => part.replace(/\d+/g, '')).join(' ');
    try {
      // send OTP via email
      const mailResponse = await mailSender(email, 'Email Verification OTP', otpTemplate(otp, name), [],
      // no additional attachments
      'user_signup_otp' // context
      );
    } catch (error) {
      console.error('Error sending email:', error);
      return res.status(500).json({
        success: false,
        message: 'Error sending verification email',
        error: error.message
      });
    }

    // create an entry for OTP in DB
    const otpBody = await OTP.create({
      email,
      otp
    });
    return res.status(200).json({
      success: true,
      message: 'OTP sent successfully'
    });
  } catch (error) {
    console.error('Error in sendOTP:', error);
    return res.status(500).json({
      success: false,
      message: 'Error while generating OTP',
      error: error.message
    });
  }
};

// ================ SIGNUP ================
exports.signup = async (req, res) => {
  try {
    // extract data 
    const {
      firstName,
      lastName,
      email,
      password,
      confirmPassword,
      accountType,
      contactNumber,
      otp
    } = req.body;

    // validation
    if (!firstName || !lastName || !email || !password || !confirmPassword || !otp) {
      return res.status(401).json({
        success: false,
        message: 'All fields are required..!'
      });
    }

    // check both pass matches or not
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        messgae: 'passowrd & confirm password does not match, Please try again..!'
      });
    }

    // check user have registered already
    const checkUserAlreadyExits = await User.findOne({
      email
    });

    // if yes ,then say to login
    if (checkUserAlreadyExits) {
      return res.status(400).json({
        success: false,
        message: 'User registered already, go to Login Page'
      });
    }

    // find most recent otp stored for user in DB
    const recentOtp = await OTP.findOne({
      email
    }).sort({
      createdAt: -1
    }).limit(1);
    // console.log('recentOtp ', recentOtp)

    // .sort({ createdAt: -1 }): 
    // It's used to sort the results based on the createdAt field in descending order (-1 means descending). 
    // This way, the most recently created OTP will be returned first.

    // .limit(1): It limits the number of documents returned to 1. 

    // if otp not found
    if (!recentOtp || recentOtp.length == 0) {
      return res.status(400).json({
        success: false,
        message: 'Otp not found in DB, please try again'
      });
    } else if (otp !== recentOtp.otp || Date.now() - new Date(recentOtp.createdAt).getTime() >= 5 * 60 * 1000) {
      // otp invalid
      return res.status(400).json({
        success: false,
        message: 'Invalid Otp'
      });
    }

    // hash - secure passoword
    let hashedPassword = await bcrypt.hash(password, 10);

    // additionDetails
    const profileDetails = await Profile.create({
      gender: null,
      dateOfBirth: null,
      about: null,
      contactNumber: null
    });
    const approved = true;

    // create entry in DB
    const consumedOtp = await OTP.findOneAndDelete({
      _id: recentOtp._id,
      otp
    });
    if (!consumedOtp) return res.status(400).json({
      success: false,
      message: 'OTP already used'
    });
    const userData = await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      contactNumber,
      accountType: 'Student',
      additionalDetails: profileDetails._id,
      approved: approved,
      image: `https://api.dicebear.com/5.x/initials/svg?seed=${firstName} ${lastName}`,
      createdVia: 'direct'
    });

    // Create notification for admin about new user registration
    await createNewUserRegistrationNotification(userData._id);

    // return success message
    res.status(200).json({
      success: true,
      message: 'User Registered Successfully'
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      error: error.message,
      messgae: 'User cannot be registered , Please try again..!'
    });
  }
};

// ================ LOGIN ================
exports.login = async (req, res) => {
  try {
    const {
      email,
      password,
      captcha
    } = req.body;

    // validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }
    // Validate captcha - TEMPORARILY DISABLED FOR TESTING
    /*
    if (!captcha) {
        return res.status(400).json({
            success: false,
            message: 'Please enter the captcha'
        });
    }
     const sessionCaptcha = req.session.captcha;
    if (!sessionCaptcha) {
        return res.status(400).json({
            success: false,
            message: 'Captcha expired. Please refresh and try again.'
        });
    }
     if (captcha.toLowerCase() !== sessionCaptcha) {
        // Clear the captcha from session
        delete req.session.captcha;
        return res.status(400).json({
            success: false,
            message: 'Invalid captcha. Please try again.'
        });
    }
     // Clear the captcha from session after successful validation
    delete req.session.captcha;
    */

    // check user is registered and saved data in DB
    let user = await User.findOne({
      email
    }).populate('additionalDetails');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'You are not registered with us'
      });
    }

    // Check if user is active
    if (!user.active) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact admin.'
      });
    }

    // comapare given password and saved password from DB
    if (await bcrypt.compare(password, user.password)) {
      const payload = {
        email: user.email,
        id: user._id,
        accountType: user.accountType // This will help to check whether user have access to route, while authorzation
      };

      // Generate token 
      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: "7d"
      });
      user = user.toObject();
      user.token = token;
      user.password = undefined; // we have remove password from object, not DB

      // cookie
      const cookieOptions = {
        expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        // 3 days
        httpOnly: true
      };
      res.cookie('token', token, cookieOptions).status(200).json({
        success: true,
        user,
        token,
        message: 'User logged in successfully'
      });
    }
    // password not match
    else {
      return res.status(401).json({
        success: false,
        message: 'Password not matched'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      messgae: 'Error while Login user'
    });
  }
};

// ================ GOOGLE OAUTH LOGIN ================
exports.googleLogin = async (req, res) => {
  try {
    const {
      credential
    } = req.body;
    if (!credential) {
      return res.status(400).json({
        success: false,
        message: 'Google credential is required'
      });
    }
    // Verify Google token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    const payload = ticket.getPayload();
    const {
      email,
      given_name,
      family_name,
      picture,
      email_verified,
      phone_number,
      locale,
      name
    } = payload;
    if (!email_verified) {
      return res.status(400).json({
        success: false,
        message: 'Google email not verified'
      });
    }

    // Check if user exists
    let user = await User.findOne({
      email
    }).populate('additionalDetails');
    let isNewUser = false;

    // If user doesn't exist, create new user
    if (!user) {
      isNewUser = true;

      // Create profile details with phone number if available
      const profileDetails = await Profile.create({
        gender: null,
        dateOfBirth: null,
        about: `Google user - ${locale || 'en'}`,
        contactNumber: phone_number || null
      });
      // Create new user with all required fields
      const firstName = given_name || name?.split(' ')[0] || email.split('@')[0];
      const lastName = family_name || name?.split(' ').slice(1).join(' ') || 'User';
      user = await User.create({
        firstName: firstName,
        lastName: lastName,
        email: email,
        password: await bcrypt.hash(Math.random().toString(36), 10),
        // Random password for Google users
        accountType: 'Student',
        // Default account type
        additionalDetails: profileDetails._id,
        approved: true,
        image: picture || `https://api.dicebear.com/5.x/initials/svg?seed=${firstName} ${lastName}`,
        active: true,
        createdVia: 'google'
      });
      // Populate additionalDetails for the newly created user
      user = await User.findById(user._id).populate('additionalDetails');

      // Create notification for admin about new user registration
      await createNewUserRegistrationNotification(user._id);
    }

    // Check if user is active
    if (!user.active) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact admin.'
      });
    }

    // Only require OTP for NEW users (first-time login)
    if (isNewUser) {
      // Generate OTP for verification
      const otp = optGenerator.generate(6, {
        upperCaseAlphabets: false,
        lowerCaseAlphabets: false,
        specialChars: false
      });
      // Save OTP to database
      await OTP.create({
        email: user.email,
        otp: otp
      });

      // Send OTP via email
      try {
        await mailSender(user.email, 'Verify Your Google Login - Beeja Academy', otpTemplate(otp, user.firstName), [],
        // no additional attachments
        'google_login_otp' // context
        );
      } catch (emailError) {
        console.error('❌ Error sending OTP email:', emailError);
        return res.status(500).json({
          success: false,
          message: 'Failed to send OTP email. Please try again.'
        });
      }

      // Return success with user info (without token)
      return res.status(200).json({
        success: true,
        requiresOTP: true,
        email: user.email,
        userId: user._id,
        message: 'OTP sent to your email. Please verify to complete registration.'
      });
    }

    // For existing users, login directly without OTP

    // Generate JWT token
    const tokenPayload = {
      email: user.email,
      id: user._id,
      accountType: user.accountType
    };
    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
      expiresIn: "7d"
    });
    user = user.toObject();
    user.token = token;
    user.password = undefined;

    // Set cookie
    const cookieOptions = {
      expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      // 3 days
      httpOnly: true
    };
    res.cookie('token', token, cookieOptions).status(200).json({
      success: true,
      user,
      token,
      message: 'Google login successful'
    });
  } catch (error) {
    console.error('❌ Error during Google login:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Error during Google authentication'
    });
  }
};

// ================ VERIFY GOOGLE LOGIN OTP ================
exports.verifyGoogleOTP = async (req, res) => {
  try {
    const {
      email,
      otp
    } = req.body;
    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP are required'
      });
    }

    // Find the most recent OTP for this email
    const recentOTP = await OTP.findOne({
      email
    }).sort({
      createdAt: -1
    }).limit(1);
    if (!recentOTP) {
      return res.status(400).json({
        success: false,
        message: 'OTP not found or expired. Please request a new one.'
      });
    }

    // Verify OTP
    if (recentOTP.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP. Please try again.'
      });
    }
    // Get user details
    let user = await User.findOne({
      email
    }).populate('additionalDetails');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user is active
    if (!user.active) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact admin.'
      });
    }

    // Generate JWT token
    const tokenPayload = {
      email: user.email,
      id: user._id,
      accountType: user.accountType
    };
    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
      expiresIn: "7d"
    });
    user = user.toObject();
    user.token = token;
    user.password = undefined;

    // Set cookie
    const cookieOptions = {
      expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      // 3 days
      httpOnly: true
    };
    res.cookie('token', token, cookieOptions).status(200).json({
      success: true,
      user,
      token,
      message: 'Google login verified successfully'
    });
  } catch (error) {
    console.error('❌ Error verifying Google OTP:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Error verifying OTP'
    });
  }
};

// ================ LINKEDIN OAUTH LOGIN ================
exports.linkedinLogin = async (req, res) => {
  try {
    const {
      code,
      redirectUri
    } = req.body;
    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'LinkedIn authorization code is required'
      });
    }

    // Exchange code for access token
    const tokenResponse = await axios.post('https://www.linkedin.com/oauth/v2/accessToken', null, {
      params: {
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri || process.env.LINKEDIN_REDIRECT_URI,
        client_id: process.env.LINKEDIN_CLIENT_ID,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    const accessToken = tokenResponse.data.access_token;

    // Get user profile
    const profileResponse = await axios.get('https://api.linkedin.com/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    const {
      email,
      given_name,
      family_name,
      picture,
      email_verified
    } = profileResponse.data;
    if (!email_verified) {
      return res.status(400).json({
        success: false,
        message: 'LinkedIn email not verified'
      });
    }

    // Check if user exists
    let user = await User.findOne({
      email
    }).populate('additionalDetails');

    // If user doesn't exist, create new user
    if (!user) {
      const profileDetails = await Profile.create({
        gender: null,
        dateOfBirth: null,
        about: 'LinkedIn user',
        contactNumber: null
      });
      const firstName = given_name || email.split('@')[0];
      const lastName = family_name || 'User';
      user = await User.create({
        firstName: firstName,
        lastName: lastName,
        email: email,
        password: await bcrypt.hash(Math.random().toString(36), 10),
        accountType: 'Student',
        additionalDetails: profileDetails._id,
        approved: true,
        image: picture || `https://api.dicebear.com/5.x/initials/svg?seed=${firstName} ${lastName}`,
        active: true,
        createdVia: 'linkedin'
      });
      user = await User.findById(user._id).populate('additionalDetails');
      await createNewUserRegistrationNotification(user._id);
    }
    if (!user.active) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact admin.'
      });
    }

    // Generate JWT token
    const token = jwt.sign({
      email: user.email,
      id: user._id,
      accountType: user.accountType
    }, process.env.JWT_SECRET, {
      expiresIn: '7d'
    });
    user = user.toObject();
    user.token = token;
    user.password = undefined;
    const cookieOptions = {
      expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      httpOnly: true
    };
    res.cookie('token', token, cookieOptions).status(200).json({
      success: true,
      user,
      token,
      message: 'LinkedIn login successful'
    });
  } catch (error) {
    console.error('❌ Error during LinkedIn login:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Error during LinkedIn authentication'
    });
  }
};

// ================ FACEBOOK OAUTH LOGIN ================
exports.facebookLogin = async (req, res) => {
  try {
    const {
      accessToken
    } = req.body;
    if (!accessToken) {
      return res.status(400).json({
        success: false,
        message: 'Facebook access token is required'
      });
    }

    // Verify token and get user data
    const response = await axios.get('https://graph.facebook.com/me', {
      params: {
        fields: 'id,name,email,picture',
        access_token: accessToken
      }
    });
    const {
      email,
      name,
      picture
    } = response.data;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email not provided by Facebook. Please ensure email permission is granted.'
      });
    }

    // Check if user exists
    let user = await User.findOne({
      email
    }).populate('additionalDetails');

    // If user doesn't exist, create new user
    if (!user) {
      const profileDetails = await Profile.create({
        gender: null,
        dateOfBirth: null,
        about: 'Facebook user',
        contactNumber: null
      });
      const nameParts = name.split(' ');
      const firstName = nameParts[0] || email.split('@')[0];
      const lastName = nameParts.slice(1).join(' ') || 'User';
      user = await User.create({
        firstName: firstName,
        lastName: lastName,
        email: email,
        password: await bcrypt.hash(Math.random().toString(36), 10),
        accountType: 'Student',
        additionalDetails: profileDetails._id,
        approved: true,
        image: picture?.data?.url || `https://api.dicebear.com/5.x/initials/svg?seed=${firstName} ${lastName}`,
        active: true,
        createdVia: 'facebook'
      });
      user = await User.findById(user._id).populate('additionalDetails');
      await createNewUserRegistrationNotification(user._id);
    }
    if (!user.active) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact admin.'
      });
    }

    // Generate JWT token
    const token = jwt.sign({
      email: user.email,
      id: user._id,
      accountType: user.accountType
    }, process.env.JWT_SECRET, {
      expiresIn: '7d'
    });
    user = user.toObject();
    user.token = token;
    user.password = undefined;
    const cookieOptions = {
      expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      httpOnly: true
    };
    res.cookie('token', token, cookieOptions).status(200).json({
      success: true,
      user,
      token,
      message: 'Facebook login successful'
    });
  } catch (error) {
    console.error('❌ Error during Facebook login:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Error during Facebook authentication'
    });
  }
};

// ================ EXTERNAL SSO LOGIN (For PHP Website Integration) ================
exports.externalSSOLogin = async (req, res) => {
  try {
    const {
      token,
      email,
      firstName,
      lastName,
      courseId,
      pid,
      phone
    } = req.body;

    // Validation
    if (!token || !email) {
      return res.status(400).json({
        success: false,
        message: 'Token and email are required'
      });
    }

    // Verify the SSO token (shared secret between PHP site and Beeja LMS)
    const ssoSecret = getSSOSecret();
    try {
      // Decode and verify the token
      const decoded = jwt.verify(token, ssoSecret);

      // Check if email matches
      if (decoded.email !== email) {
        return res.status(401).json({
          success: false,
          message: 'Invalid SSO token'
        });
      }
    } catch (error) {
      console.error('SSO Token verification failed:', error);
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired SSO token'
      });
    }

    // Check if user exists in Beeja LMS
    let user = await User.findOne({
      email
    }).populate('additionalDetails');
    let isNewUser = false;

    // If user doesn't exist, create new user
    if (!user) {
      isNewUser = true;

      // Create profile details
      const profileDetails = await Profile.create({
        gender: null,
        dateOfBirth: null,
        about: 'User from skilli.jobs',
        contactNumber: phone || null
      });
      const userFirstName = firstName || email.split('@')[0];
      const userLastName = lastName || 'User';
      user = await User.create({
        firstName: userFirstName,
        lastName: userLastName,
        email: email,
        password: await bcrypt.hash(Math.random().toString(36), 10),
        // Random password for SSO users
        accountType: 'Student',
        additionalDetails: profileDetails._id,
        approved: true,
        image: `https://api.dicebear.com/5.x/initials/svg?seed=${userFirstName} ${userLastName}`,
        active: true,
        createdVia: 'php_website',
        pid: pid || null
      });
      // Populate additionalDetails for the newly created user
      user = await User.findById(user._id).populate('additionalDetails');

      // Create notification for admin about new user registration
      await createNewUserRegistrationNotification(user._id);
    } else {
      // Update existing user's phone if provided and not already set
      if (phone && user.additionalDetails && !user.additionalDetails.contactNumber) {
        await Profile.findByIdAndUpdate(user.additionalDetails._id, {
          contactNumber: phone
        });
        // Reload user to get updated phone
        user = await User.findById(user._id).populate('additionalDetails');
      }
    }

    // Check if user is active
    if (!user.active) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact admin.'
      });
    }

    // Generate JWT token for Beeja LMS
    const tokenPayload = {
      email: user.email,
      id: user._id,
      accountType: user.accountType
    };
    const beejaToken = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
      expiresIn: "7d"
    });
    user = user.toObject();
    user.token = beejaToken;
    user.password = undefined;

    // Set cookie
    const cookieOptions = {
      expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      // 3 days
      httpOnly: true
    };

    // Prepare redirect URL
    let redirectUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    if (courseId) {
      redirectUrl += `/courses/${courseId}`;
    } else {
      redirectUrl += '/dashboard/my-profile';
    }
    res.cookie('token', beejaToken, cookieOptions).status(200).json({
      success: true,
      user,
      token: beejaToken,
      redirectUrl,
      isNewUser,
      message: 'SSO login successful'
    });
  } catch (error) {
    console.error('❌ Error during External SSO login:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Error during SSO authentication'
    });
  }
};

// ================ CHANGE PASSWORD ================
exports.changePassword = async (req, res) => {
  try {
    // extract data
    const {
      oldPassword,
      newPassword,
      confirmNewPassword
    } = req.body;

    // validation
    if (!oldPassword || !newPassword || !confirmNewPassword) {
      return res.status(403).json({
        success: false,
        message: 'All fileds are required'
      });
    }

    // get user
    const userDetails = await User.findById(req.user.id);

    // validate old passowrd entered correct or not
    const isPasswordMatch = await bcrypt.compare(oldPassword, userDetails.password);

    // if old password not match 
    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: "Old password is Incorrect"
      });
    }

    // check both passwords are matched
    if (newPassword !== confirmNewPassword) {
      return res.status(403).json({
        success: false,
        message: 'The password and confirm password do not match'
      });
    }

    // hash password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // update in DB
    const updatedUserDetails = await User.findByIdAndUpdate(req.user.id, {
      password: hashedPassword
    }, {
      new: true
    });

    // send email
    try {
      const emailResponse = await mailSender(updatedUserDetails.email, 'Password for your account has been updated', passwordUpdated(updatedUserDetails.email, `${updatedUserDetails.firstName} ${updatedUserDetails.lastName}`), [],
      // no additional attachments
      'password_update_notification' // context
      );
      // console.log("Email sent successfully:", emailResponse);
    } catch (error) {
      console.error("Error occurred while sending email:", error);
      return res.status(500).json({
        success: false,
        message: "Error occurred while sending email",
        error: error.message
      });
    }

    // return success response
    res.status(200).json({
      success: true,
      mesage: 'Password changed successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      messgae: 'Error while changing passowrd'
    });
  }
};

// ================ LOGIN BY PID (For PHP Portal Upskill Button) ================
exports.loginByPID = async (req, res) => {
  try {
    const {
      pid,
      token
    } = req.body;

    // Validation
    if (!pid || !token) {
      return res.status(400).json({
        success: false,
        message: 'PID and token are required'
      });
    }
    // Verify the SSO token (shared secret between PHP site and Beeja LMS)
    const SSO_SECRET = getSSOSecret();
    let decoded;
    try {
      decoded = jwt.verify(token, SSO_SECRET);
      if (decoded.pid !== pid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid token for this PID'
        });
      }
    } catch (error) {
      console.error('❌ Token verification failed:', error.message);
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    // Find user by PID or email
    let user = await User.findOne({
      pid: pid.toString()
    }).populate('additionalDetails');

    // If not found by PID, check by email (in case user was created through other methods)
    if (!user && decoded.email) {
      user = await User.findOne({
        email: decoded.email
      }).populate('additionalDetails');
      if (user) {
        // Update the user's PID and createdVia
        user.pid = pid.toString();
        if (!user.createdVia || user.createdVia === 'direct') {
          user.createdVia = 'php_website';
        }
        await user.save();

        // Reload user to get updated data
        user = await User.findById(user._id).populate('additionalDetails');
      }
    }
    if (!user) {
      // Parse name from decoded token (sent from PHP website)
      const fullName = decoded.name || 'User';
      const nameParts = fullName.trim().split(' ');
      const firstName = nameParts[0] || 'User';
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : firstName;

      // Generate avatar image using dicebear API
      const avatarUrl = `https://api.dicebear.com/5.x/initials/svg?seed=${encodeURIComponent(fullName)}`;

      // Create profile first (required for user)
      const profileDetails = await Profile.create({
        gender: null,
        dateOfBirth: null,
        about: null,
        contactNumber: null
      });

      // Generate a random password (user won't use it since they login via SSO)
      const randomPassword = await bcrypt.hash('sso_user_' + Date.now(), 10);

      // Create new user with profile ID and all required fields
      const newUser = await User.create({
        firstName: firstName,
        lastName: lastName,
        email: decoded.email,
        password: randomPassword,
        image: avatarUrl,
        pid: pid.toString(),
        accountType: 'Student',
        active: true,
        approved: true,
        additionalDetails: profileDetails._id,
        createdVia: 'php_website'
      });

      // Populate and get fresh user
      user = await User.findById(newUser._id).populate('additionalDetails');
    }

    // Check if user is active
    if (!user.active) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact admin.'
      });
    }

    // Generate JWT token for Beeja LMS
    const tokenPayload = {
      email: user.email,
      id: user._id,
      accountType: user.accountType
    };
    const jwtToken = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
      expiresIn: '7d'
    });

    // Set cookie
    const options = {
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      // 24 hours
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    };
    res.cookie('token', jwtToken, options);

    // Return success response
    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token: jwtToken,
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        accountType: user.accountType,
        image: user.image,
        pid: user.pid,
        createdVia: user.createdVia,
        additionalDetails: user.additionalDetails,
        active: user.active,
        approved: user.approved
      }
    });
  } catch (error) {
    console.error('========================================');
    console.error('❌ ERROR in loginByPID:');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('========================================');
    return res.status(500).json({
      success: false,
      message: 'Login failed. Please try again.',
      error: error.message
    });
  }
};

// ================ CHECK USER BY PID (For PHP Portal User Check) ================
exports.checkUserByPID = async (req, res) => {
  try {
    const {
      pid,
      token
    } = req.query;
    if (!pid) {
      return res.status(400).json({
        success: false,
        message: 'PID is required',
        exists: false
      });
    }

    // Verify JWT token if provided
    if (token) {
      try {
        const decoded = jwt.verify(token, getSSOSecret());
      } catch (tokenError) {
        console.error('Token verification failed:', tokenError);
        return res.status(401).json({
          success: false,
          message: 'Invalid token',
          exists: false
        });
      }
    }

    // Check if user exists with this PID
    const user = await User.findOne({
      pid
    });
    return res.status(200).json({
      success: true,
      exists: !!user,
      message: user ? 'User exists' : 'User not found'
    });
  } catch (error) {
    console.error('Error in checkUserByPID:', error);
    return res.status(500).json({
      success: false,
      message: 'Check failed. Please try again.',
      exists: false,
      error: error.message
    });
  }
};

// ================ SSO LOGOUT (For Skilli Jobs Integration) ================
exports.ssoLogout = async (req, res) => {
  try {
    const {
      pid
    } = req.body;
    if (!pid) {
      return res.status(400).json({
        success: false,
        message: 'PID is required for SSO logout'
      });
    }

    // Find user by PID
    const user = await User.findOne({
      pid
    }).populate('additionalDetails');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    // Clear the cookie in Beeja LMS
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });

    // Notify Skilli Jobs to clear session
    const phpWebsiteUrl = process.env.PHP_WEBSITE_URL || 'http://127.0.0.1:8000';
    try {
      // Generate SSO token for secure session clearing
      const ssoSecret = getSSOSecret();
      const logoutToken = jwt.sign({
        pid: user.pid,
        action: 'sso_logout',
        timestamp: Date.now()
      }, ssoSecret, {
        expiresIn: '5m'
      });

      // Call PHP logout endpoint
      const axios = require('axios');
      await axios.post(`${phpWebsiteUrl}/api/sso-clear-session`, {
        pid: user.pid,
        token: logoutToken
      }, {
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    } catch (phpError) {
      console.error('Failed to notify Skilli Jobs for session clearing:', phpError.message);
      // Continue with logout even if PHP notification fails
    }

    // Return success with Skilli Jobs redirect URL
    return res.status(200).json({
      success: true,
      message: 'Logged out successfully',
      redirectUrl: phpWebsiteUrl,
      loginUrl: `${phpWebsiteUrl}/login`
    });
  } catch (error) {
    console.error('SSO Logout Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Logout failed. Please try again.',
      error: error.message
    });
  }
};
