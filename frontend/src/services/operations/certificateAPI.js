import { toast } from "react-hot-toast"
import { apiConnector } from "../apiConnector"
import { certificateEndpoints } from "../apis"

const {
  GENERATE_CERTIFICATE_API,
  VERIFY_CERTIFICATE_API,
  GET_USER_CERTIFICATES_API,
  ADMIN_MANUAL_CERTIFICATES_API,
  ADMIN_CERTIFICATE_ASSET_API,
  ADMIN_CERTIFICATE_TEMPLATE_API,
  ADMIN_CERTIFICATE_BATCH_API,
} = certificateEndpoints

export async function getCertificateBatch(batchId, token) {
  const response = await apiConnector('GET', `${ADMIN_CERTIFICATE_BATCH_API}/${encodeURIComponent(batchId)}`, null, {
    Authorization: `Bearer ${token}`,
  });
  return response.data.data;
}

export async function getCertificateTemplate(token, scope = 'manual') {
  const response = await apiConnector('GET', ADMIN_CERTIFICATE_TEMPLATE_API, null, {
    Authorization: `Bearer ${token}`,
  }, { scope });
  return response.data.data;
}

export async function saveCertificateTemplate(payload, token) {
  const response = await apiConnector('PUT', ADMIN_CERTIFICATE_TEMPLATE_API, payload, {
    Authorization: `Bearer ${token}`,
  });
  return response.data.data;
}

export async function uploadCertificateAsset(file, token) {
  const data = new FormData();
  data.append('asset', file);
  const response = await apiConnector('POST', ADMIN_CERTIFICATE_ASSET_API, data, {
    Authorization: `Bearer ${token}`,
  });
  return response.data.url;
}

export async function issueManualCertificates(payload, token) {
  const response = await apiConnector('POST', ADMIN_MANUAL_CERTIFICATES_API, payload, {
    Authorization: `Bearer ${token}`,
  });
  return response.data.data;
}

export async function getManualCertificates(token, page = 1, filters = {}) {
  const response = await apiConnector('GET', ADMIN_MANUAL_CERTIFICATES_API, null, {
    Authorization: `Bearer ${token}`,
  }, { page, source: filters.source === 'course' ? 'course' : 'manual', limit: filters.limit || 25, search: filters.search || undefined, design: filters.design || undefined,
    from: filters.from || undefined, to: filters.to || undefined, sort: filters.sort || 'newest', collegeId: filters.collegeId || undefined });
  return response.data;
}

export async function getCertificateColleges(token, search = '') {
  const response = await apiConnector('GET', ADMIN_MANUAL_CERTIFICATES_API.replace('/manual', '/colleges'), null, { Authorization: `Bearer ${token}` }, { search: search || undefined });
  return response.data.data;
}

export async function createCertificateCollege(payload, token) {
  const response = await apiConnector('POST', ADMIN_MANUAL_CERTIFICATES_API.replace('/manual', '/colleges'), payload, { Authorization: `Bearer ${token}` });
  return response.data.data;
}

export async function setCertificateStatus(certificateId, isActive, token) {
  const endpoint = ADMIN_MANUAL_CERTIFICATES_API.replace('/manual', `/${encodeURIComponent(certificateId)}/status`);
  const response = await apiConnector('PATCH', endpoint, { isActive }, { Authorization: `Bearer ${token}` });
  return response.data.data;
}

export async function deleteCertificate(certificateId, token) {
  const endpoint = ADMIN_MANUAL_CERTIFICATES_API.replace('/manual', `/${encodeURIComponent(certificateId)}`);
  const response = await apiConnector('DELETE', endpoint, null, { Authorization: `Bearer ${token}` });
  return response.data;
}

export async function bulkSetCertificateStatus(certificateIds, isActive, token) {
  const endpoint = ADMIN_MANUAL_CERTIFICATES_API.replace('/manual', '/bulk/status');
  const response = await apiConnector('PATCH', endpoint, { certificateIds, isActive }, { Authorization: `Bearer ${token}` });
  return response.data;
}

export async function bulkDeleteCertificates(certificateIds, token) {
  const endpoint = ADMIN_MANUAL_CERTIFICATES_API.replace('/manual', '/bulk');
  const response = await apiConnector('DELETE', endpoint, { certificateIds }, { Authorization: `Bearer ${token}` });
  return response.data;
}

export async function generateCertificate(data, token) {
  const toastId = toast.loading("Generating certificate...")
  let result = null
  try {
    const response = await apiConnector("POST", GENERATE_CERTIFICATE_API, data, {
      Authorization: `Bearer ${token}`,
    })
    console.log("GENERATE CERTIFICATE API RESPONSE............", response)
    if (!response?.data?.success) {
      throw new Error("Could Not Generate Certificate")
    }
    toast.success("Certificate generated successfully!")
    result = response?.data?.data
  } catch (error) {
    console.log("GENERATE CERTIFICATE API ERROR............", error)
    console.log("Error response data:", error?.response?.data)
    
    const errorMessage = error.response?.data?.message || "Could Not Generate Certificate"
    toast.error(errorMessage)
    
    // Log debug information if available
    if (error?.response?.data?.debug) {
      console.log("Debug info:", error.response.data.debug)
    }
  }
  toast.dismiss(toastId)
  return result
}

export async function verifyCertificate(certificateId) {
  let result = null
  try {
    const normalizedId = String(certificateId).trim().toUpperCase()
    const response = await apiConnector("GET", `${VERIFY_CERTIFICATE_API}/${encodeURIComponent(normalizedId)}`, null, null, { _: Date.now() })
    console.log("VERIFY CERTIFICATE API RESPONSE............", response)
    if (!response?.data?.success) {
      throw new Error("Could Not Verify Certificate")
    }
    result = response?.data?.data
  } catch (error) {
    console.log("VERIFY CERTIFICATE API ERROR............", error)
    throw new Error(error.response?.data?.message || "Could Not Verify Certificate")
  }
  return result
}

export async function getUserCertificates(token) {
  let result = []
  try {
    const response = await apiConnector("GET", GET_USER_CERTIFICATES_API, null, {
      Authorization: `Bearer ${token}`,
    })
    console.log("GET USER CERTIFICATES API RESPONSE............", response)
    if (!response?.data?.success) {
      throw new Error("Could Not Get User Certificates")
    }
    result = response?.data?.data
  } catch (error) {
    console.log("GET USER CERTIFICATES API ERROR............", error)
    toast.error("Could Not Get User Certificates")
  }
  return result
}

export async function getLmsEnrollments(token, page = 1, search = '') {
  const response = await apiConnector('GET', ADMIN_MANUAL_CERTIFICATES_API.replace('/manual', '/lms/enrollments'), null, { Authorization: `Bearer ${token}` }, { page, search });
  return response.data;
}
export async function createLmsCertificate(studentId, courseId, token, designChoice = 'standard') {
  const response = await apiConnector('POST', ADMIN_MANUAL_CERTIFICATES_API.replace('/manual', '/lms/generate'), { studentId, courseId, designChoice }, { Authorization: `Bearer ${token}` });
  return response.data.data;
}
