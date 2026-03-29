// Land Records utility functions for fetching various land-related data from Tamil Nadu GIS APIs

export interface LandRecordData {
  pattaOwnership?: any
  pattaCopy?: any
  fmbSketch?: any
  encumbranceCertificate?: any
  masterPlanFeature?: any
  fetchedAt?: Date
  errors?: string[]
}

export interface LandRecordLocation {
  districtCode: string
  talukCode: string
  villageCode: string
  surveyNumber: string
  subDivisionNumber?: string
}

export interface LandRecordOptions {
  includePattaOwnership?: boolean
  includePattaCopy?: boolean
  includeFmbSketch?: boolean
  includeEncumbranceCertificate?: boolean
  includeMasterPlanFeature?: boolean
  latitude?: number
  longitude?: number
  // Optional progress handler to act on each fetched item immediately
  onProgress?: (
    kind: 'pattaOwnership' | 'pattaCopy' | 'fmbSketch' | 'encumbranceCertificate' | 'masterPlanFeature',
    result: any | null,
    error?: string
  ) => void | Promise<void>
}

// Helper function to create session headers
function createHeaders() {
  return {
    'accept': '*/*',
    'accept-encoding': 'gzip, deflate, br, zstd',
    'accept-language': 'en-GB,en-US;q=0.9,en;q=0.8,ur;q=0.7',
    'cache-control': 'no-cache',
    'connection': 'keep-alive',
    'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
    'cookie': 'PHPSESSID=pelr6aggf41082o6mrdhap221e',
    'host': 'tngis.tn.gov.in',
    'origin': 'https://tngis.tn.gov.in',
    'referer': 'https://tngis.tn.gov.in/apps/gi_viewer/',
    'sec-ch-ua': '"Not;A=Brand";v="99", "Google Chrome";v="139", "Chromium";v="139"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'same-origin',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',
    'x-app-name': 'demo',
    'x-requested-with': 'XMLHttpRequest'
  }
}

// Function to fetch patta ownership
export async function fetchPattaOwnership(location: LandRecordLocation): Promise<any> {
  const url = "https://tngis.tn.gov.in/apps/tamilnilam_api/v1/tamil_nillam_ownership"
  
  const payload = new URLSearchParams({
    district_code: location.districtCode,
    taluk_code: location.talukCode,
    village_code: location.villageCode,
    survey_number: location.surveyNumber,
    sub_division_number: location.subDivisionNumber || '',
    land_type: 'rural',
    code_type: 'revenue',
    search_type: 'survey_number'
  })

  const response = await fetch(url, {
    method: 'POST',
    headers: createHeaders(),
    body: payload
  })

  if (!response.ok) {
    throw new Error(`Patta Ownership API error: ${response.statusText}`)
  }

  const result = await response.json()
  
  // Validate response structure based on notebook findings
  if (!result.success || result.success !== 1) {
    throw new Error(`Patta Ownership API error: ${result.message || 'Invalid response'}`)
  }

  return result
}

// Function to fetch patta copy
export async function fetchPattaCopy(location: LandRecordLocation, pattaNumber: string): Promise<any> {
  const url = "https://tngis.tn.gov.in/apps/tamilnilam_api/v1/pattacopy"
  
  const payload = new URLSearchParams({
    district_code: location.districtCode,
    taluk_code: location.talukCode,
    village_code: location.villageCode,
    patta_number: pattaNumber
  })

  const response = await fetch(url, {
    method: 'POST',
    headers: createHeaders(),
    body: payload
  })

  if (!response.ok) {
    throw new Error(`Patta Copy API error: ${response.statusText}`)
  }

  return await response.json()
}

// Function to fetch FMB sketch
export async function fetchFmbSketch(location: LandRecordLocation): Promise<any> {
  const url = "https://tngis.tn.gov.in/apps/generic_api/v1/fmb_sketch"
  
  const payload = new URLSearchParams({
    districtCode: location.districtCode,
    talukCode: location.talukCode,
    villageCode: location.villageCode,
    surveyNumber: location.surveyNumber,
    subdivisionNumber: location.subDivisionNumber || '',
    type: 'rural'
  })

  const response = await fetch(url, {
    method: 'POST',
    headers: createHeaders(),
    body: payload
  })

  if (!response.ok) {
    // Handle specific 500 errors from NIC
    if (response.status === 500) {
      const errorText = await response.text()
      if (errorText.includes('Unable to fetch data from NIC')) {
        throw new Error('FMB Sketch service temporarily unavailable (NIC server error)')
      }
    }
    throw new Error(`FMB Sketch API error: ${response.statusText}`)
  }

  const result = await response.json()
  
  // Check for error responses
  if (result.status === 5 || result.status === 'error') {
    throw new Error(`FMB Sketch API error: ${result.message || 'Service unavailable'}`)
  }

  return result
}

// Function to fetch encumbrance certificate
export async function fetchEncumbranceCertificate(location: LandRecordLocation): Promise<any> {
  const url = "https://tngis.tn.gov.in/apps/gi_viewer_api/api/encumbrance_certificate"
  
  const payload = new URLSearchParams({
    revDistrictCode: location.districtCode,
    revTalukCode: location.talukCode,
    revVillageCode: location.villageCode,
    sub_division_number: location.subDivisionNumber || '',
    survey_number: location.surveyNumber
  })

  const response = await fetch(url, {
    method: 'POST',
    headers: createHeaders(),
    body: payload
  })

  if (!response.ok) {
    throw new Error(`Encumbrance Certificate API error: ${response.statusText}`)
  }

  const result = await response.json()
  
  // Check for error responses
  if (result.status === 'error') {
    throw new Error(`Encumbrance Certificate API error: ${result.message || 'Invalid request format'}`)
  }

  return result
}

// Function to fetch master plan feature
export async function fetchMasterPlanFeature(latitude: number, longitude: number): Promise<any> {
  const url = "https://tngis.tn.gov.in/apps/gi_viewer_api/api/master_plan_feature_extract"
  
  const payload = new URLSearchParams({
    latitude: latitude.toString(),
    longitude: longitude.toString()
  })

  const response = await fetch(url, {
    method: 'POST',
    headers: createHeaders(),
    body: payload
  })

  if (!response.ok) {
    throw new Error(`Master Plan Feature API error: ${response.statusText}`)
  }

  const result = await response.json()
  
  // Validate response structure based on notebook findings
  if (!result.success || result.success !== 1) {
    throw new Error(`Master Plan Feature API error: ${result.message || 'Invalid response'}`)
  }

  return result
}

// Main function to fetch all land records for a location
export async function fetchAllLandRecords(
  location: LandRecordLocation, 
  options: LandRecordOptions = {}
): Promise<LandRecordData> {
  const results: LandRecordData = {
    errors: []
  }

  const {
    includePattaOwnership = true,
    includePattaCopy = true,
    includeFmbSketch = true,
    includeEncumbranceCertificate = true,
    includeMasterPlanFeature = false,
    latitude,
  longitude,
  onProgress
  } = options

  // Validate required parameters before making any API calls
  const missingParams = [];
  if (!location.districtCode) missingParams.push('districtCode');
  if (!location.talukCode) missingParams.push('talukCode');
  if (!location.villageCode) missingParams.push('villageCode');
  if (!location.surveyNumber) missingParams.push('surveyNumber');

  console.log(`🔍 Fetching land records for: District ${location.districtCode}, Taluk ${location.talukCode}, Village ${location.villageCode}, Survey ${location.surveyNumber}${location.subDivisionNumber ? `/${location.subDivisionNumber}` : ''}`);

  if (missingParams.length > 0) {
    const errorMsg = `Missing required parameters: ${missingParams.join(', ')}`;
    console.log(`❌ ${errorMsg}`);
    results.errors?.push(errorMsg);
    results.fetchedAt = new Date();
    return results;
  }

  // ...existing code for API calls...
  // Fetch patta ownership
  if (includePattaOwnership) {
    try {
      console.log('📋 Fetching Patta Ownership...');
      const pattaData = await fetchPattaOwnership(location);
      results.pattaOwnership = pattaData;
      console.log('✅ Patta Ownership fetched successfully');
  if (onProgress) await onProgress('pattaOwnership', pattaData);

      // If patta ownership successful and contains patta number, fetch patta copy
      if (includePattaCopy && pattaData?.data?.land_detail?.pattaNo) {
        try {
          console.log('📄 Fetching Patta Copy...');
          const pattaCopyData = await fetchPattaCopy(location, pattaData.data.land_detail.pattaNo.toString());
          results.pattaCopy = pattaCopyData;
          console.log('✅ Patta Copy fetched successfully');
          if (onProgress) await onProgress('pattaCopy', pattaCopyData);
        } catch (error) {
          const errorMsg = `Patta Copy: ${error instanceof Error ? error.message : 'Unknown error'}`;
          console.log(`❌ ${errorMsg}`);
          results.errors?.push(errorMsg);
          if (onProgress) await onProgress('pattaCopy', null, errorMsg);
        }
      } else if (includePattaCopy) {
        const errorMsg = 'Patta Copy: No patta number available from patta ownership';
        console.log(`⚠️ ${errorMsg}`);
        results.errors?.push(errorMsg);
        if (onProgress) await onProgress('pattaCopy', null, errorMsg);
      }
    } catch (error) {
      const errorMsg = `Patta Ownership: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.log(`❌ ${errorMsg}`);
      results.errors?.push(errorMsg);
      if (onProgress) await onProgress('pattaOwnership', null, errorMsg);
    }
  }

  // Fetch FMB sketch
  if (includeFmbSketch) {
    try {
      console.log('🗺️ Fetching FMB Sketch...');
      const fmbData = await fetchFmbSketch(location);
      results.fmbSketch = fmbData;
      console.log('✅ FMB Sketch fetched successfully');
  if (onProgress) await onProgress('fmbSketch', fmbData);
    } catch (error) {
      const errorMsg = `FMB Sketch: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.log(`❌ ${errorMsg}`);
      results.errors?.push(errorMsg);
  if (onProgress) await onProgress('fmbSketch', null, errorMsg);
    }
  }

  // Fetch encumbrance certificate
  if (includeEncumbranceCertificate) {
    try {
      console.log('📜 Fetching Encumbrance Certificate...');
      const encumbranceData = await fetchEncumbranceCertificate(location);
      results.encumbranceCertificate = encumbranceData;
      console.log('✅ Encumbrance Certificate fetched successfully');
  if (onProgress) await onProgress('encumbranceCertificate', encumbranceData);
    } catch (error) {
      const errorMsg = `Encumbrance Certificate: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.log(`❌ ${errorMsg}`);
      results.errors?.push(errorMsg);
  if (onProgress) await onProgress('encumbranceCertificate', null, errorMsg);
    }
  }

  // Fetch master plan feature if coordinates provided
  if (includeMasterPlanFeature && latitude && longitude) {
    try {
      console.log('🏗️ Fetching Master Plan Feature...');
      const masterPlanData = await fetchMasterPlanFeature(latitude, longitude);
      results.masterPlanFeature = masterPlanData;
      console.log('✅ Master Plan Feature fetched successfully');
  if (onProgress) await onProgress('masterPlanFeature', masterPlanData);
    } catch (error) {
      const errorMsg = `Master Plan Feature: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.log(`❌ ${errorMsg}`);
      results.errors?.push(errorMsg);
  if (onProgress) await onProgress('masterPlanFeature', null, errorMsg);
    }
  }

  results.fetchedAt = new Date();
  
  const successCount = [
    results.pattaOwnership,
    results.pattaCopy,
    results.fmbSketch,
    results.encumbranceCertificate,
    results.masterPlanFeature
  ].filter(Boolean).length;
  
  const totalRequested = [
    includePattaOwnership,
    includePattaCopy,
    includeFmbSketch,
    includeEncumbranceCertificate,
    includeMasterPlanFeature
  ].filter(Boolean).length;
  
  console.log(`📊 Land records fetch completed: ${successCount}/${totalRequested} successful`);
  if (results.errors && results.errors.length > 0) {
    console.log(`⚠️ Errors encountered: ${results.errors.length}`);
  }
  
  return results;
}

// Helper function to extract patta number from patta ownership response
export function extractPattaNumber(pattaOwnershipData: any): string | null {
  if (!pattaOwnershipData) return null
  
  // Based on the notebook response structure
  if (pattaOwnershipData.data?.land_detail?.pattaNo) {
    return pattaOwnershipData.data.land_detail.pattaNo.toString()
  }
  
  // Fallback patterns
  if (pattaOwnershipData.patta_number) {
    return pattaOwnershipData.patta_number.toString()
  }
  
  if (pattaOwnershipData.pattaNumber) {
    return pattaOwnershipData.pattaNumber.toString()
  }
  
  return null
}