import PropTypes from "prop-types";
const HighlightText = ({
  text
}) => {
  return <span className='font-bold text-richblue-200 gradient_color'>
      {" "}
      {text}
    </span>;
};
export default HighlightText;
HighlightText.propTypes = {
  "text": PropTypes.node
};
