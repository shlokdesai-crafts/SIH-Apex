import { Router, Request, Response } from 'express';
import { query } from '../config/database.js';
import { 
  calculateFertilizerAdvisory, 
  CalculateAdvisoryInput 
} from '../services/recommendationEngine.js';

const router = Router();

/**
 * @route   GET /api/advisories/context or /api/advisory/context
 * @desc    Fetch active farmer profile, farm parcel, active crop cycle, and latest certified soil test
 * @access  Public
 */
router.get('/context', async (req: Request, res: Response) => {
  try {
    const requestedCrop = (req.query.crop as string || req.query.cropId as string || 'tomato').toLowerCase().trim();
    const farmerIdParam = req.query.farmerId as string | undefined;
    const farmIdParam = req.query.farmId as string | undefined;

    // 1. Fetch Farmer
    let farmerRow: any = null;
    if (farmerIdParam) {
      const fRes = await query(`SELECT * FROM farmers WHERE id = $1 LIMIT 1;`, [farmerIdParam]);
      farmerRow = fRes.rows[0];
    }
    if (!farmerRow) {
      const fRes = await query(`SELECT * FROM farmers WHERE is_active = true ORDER BY created_at ASC LIMIT 1;`);
      farmerRow = fRes.rows[0];
    }

    if (!farmerRow) {
      return res.status(404).json({
        status: 'error',
        message: 'No active farmer profile found in database.',
      });
    }

    // 2. Fetch Farm
    let farmRow: any = null;
    if (farmIdParam) {
      const farmRes = await query(`SELECT * FROM farms WHERE id = $1 LIMIT 1;`, [farmIdParam]);
      farmRow = farmRes.rows[0];
    }
    if (!farmRow) {
      const farmRes = await query(
        `SELECT * FROM farms WHERE farmer_id = $1 AND is_active = true ORDER BY created_at ASC LIMIT 1;`,
        [farmerRow.id]
      );
      farmRow = farmRes.rows[0];
    }
    if (!farmRow) {
      const farmRes = await query(`SELECT * FROM farms WHERE is_active = true ORDER BY created_at ASC LIMIT 1;`);
      farmRow = farmRes.rows[0];
    }

    // 3. Fetch Crop Cycle
    let cropCycleRow: any = null;
    if (farmRow) {
      // Look for specified crop first
      const ccRes = await query(
        `SELECT * FROM crop_cycles 
         WHERE farm_id = $1 AND LOWER(crop_id) = $2 AND status = 'active'
         ORDER BY created_at DESC LIMIT 1;`,
        [farmRow.id, requestedCrop]
      );
      cropCycleRow = ccRes.rows[0];

      // If not found, try matching by crop name
      if (!cropCycleRow) {
        const ccNameRes = await query(
          `SELECT * FROM crop_cycles 
           WHERE farm_id = $1 AND LOWER(crop_name) LIKE $2 AND status = 'active'
           ORDER BY created_at DESC LIMIT 1;`,
          [farmRow.id, `%${requestedCrop}%`]
        );
        cropCycleRow = ccNameRes.rows[0];
      }

      // If still not found, get the latest active crop cycle
      if (!cropCycleRow) {
        const ccAnyRes = await query(
          `SELECT * FROM crop_cycles 
           WHERE farm_id = $1 AND status = 'active'
           ORDER BY created_at DESC LIMIT 1;`,
          [farmRow.id]
        );
        cropCycleRow = ccAnyRes.rows[0];
      }
    }

    // 4. Fetch Latest Soil Test
    let soilTestRow: any = null;
    if (farmRow) {
      const stRes = await query(
        `SELECT * FROM soil_tests 
         WHERE farm_id = $1 AND status = 'valid'
         ORDER BY sample_date DESC, created_at DESC LIMIT 1;`,
        [farmRow.id]
      );
      soilTestRow = stRes.rows[0];
    }
    if (!soilTestRow) {
      const stAnyRes = await query(
        `SELECT * FROM soil_tests 
         WHERE status = 'valid'
         ORDER BY sample_date DESC, created_at DESC LIMIT 1;`
      );
      soilTestRow = stAnyRes.rows[0];
    }

    // Format response
    const contextData = {
      farmer: {
        id: farmerRow.id,
        fullName: farmerRow.full_name,
        phoneNumber: farmerRow.phone_number,
        email: farmerRow.email,
        preferredLanguage: farmerRow.preferred_language,
        state: farmerRow.state,
        district: farmerRow.district,
        taluka: farmerRow.taluka,
        village: farmerRow.village,
        avatarUrl: farmerRow.avatar_url,
      },
      farm: farmRow ? {
        id: farmRow.id,
        farmerId: farmRow.farmer_id,
        farmName: farmRow.farm_name,
        totalArea: parseFloat(farmRow.total_area || '0'),
        areaUnit: farmRow.area_unit || 'Acres',
        soilType: farmRow.soil_type,
        irrigationType: farmRow.irrigation_type,
        latitude: farmRow.latitude ? parseFloat(farmRow.latitude) : null,
        longitude: farmRow.longitude ? parseFloat(farmRow.longitude) : null,
        surveyNumber: farmRow.survey_number,
      } : null,
      cropCycle: cropCycleRow ? {
        id: cropCycleRow.id,
        farmId: cropCycleRow.farm_id,
        cropId: cropCycleRow.crop_id,
        cropName: cropCycleRow.crop_name,
        variety: cropCycleRow.variety,
        season: cropCycleRow.season,
        sowingDate: cropCycleRow.sowing_date,
        expectedHarvestDate: cropCycleRow.expected_harvest_date,
        currentStage: cropCycleRow.current_stage,
        stageDayCount: cropCycleRow.stage_day_count,
        totalCycleDays: cropCycleRow.total_cycle_days,
        allocatedAcres: parseFloat(cropCycleRow.allocated_acres || '0'),
        status: cropCycleRow.status,
        healthScore: cropCycleRow.health_score,
        todayAdvice: cropCycleRow.today_advice,
      } : null,
      soilTest: soilTestRow ? {
        id: soilTestRow.id,
        farmId: soilTestRow.farm_id,
        sampleId: soilTestRow.sample_id,
        testingLabName: soilTestRow.testing_lab_name,
        testedBy: soilTestRow.tested_by,
        sampleDate: soilTestRow.sample_date,
        status: soilTestRow.status,
        nitrogenVal: parseFloat(soilTestRow.nitrogen_val || '0'),
        nitrogenStatus: soilTestRow.nitrogen_status,
        nitrogenTarget: parseFloat(soilTestRow.nitrogen_target || '0'),
        phosphorusVal: parseFloat(soilTestRow.phosphorus_val || '0'),
        phosphorusStatus: soilTestRow.phosphorus_status,
        phosphorusTarget: parseFloat(soilTestRow.phosphorus_target || '0'),
        potassiumVal: parseFloat(soilTestRow.potassium_val || '0'),
        potassiumStatus: soilTestRow.potassium_status,
        potassiumTarget: parseFloat(soilTestRow.potassium_target || '0'),
        phVal: parseFloat(soilTestRow.ph_val || '7.0'),
        phLabel: soilTestRow.ph_label,
        organicCarbonPercent: parseFloat(soilTestRow.organic_carbon_percent || '0'),
        organicCarbonStatus: soilTestRow.organic_carbon_status,
        electricalConductivityDsM: soilTestRow.electrical_conductivity_ds_m ? parseFloat(soilTestRow.electrical_conductivity_ds_m) : null,
        zincStatus: soilTestRow.zinc_status,
        ironStatus: soilTestRow.iron_status,
        micronutrientsSummary: soilTestRow.micronutrients_summary,
        healthIndexScore: soilTestRow.health_index_score,
        reportPdfUrl: soilTestRow.report_pdf_url,
        remarks: soilTestRow.remarks,
      } : null,
    };

    return res.status(200).json({
      status: 'success',
      data: contextData,
    });
  } catch (error: any) {
    console.error('[Advisory Context Error]:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve farmer advisory context from database.',
      error: process.env.NODE_ENV === 'development' ? error?.message : undefined,
    });
  }
});

/**
 * @route   GET /api/advisories/farmer/active
 * @desc    Get active farmer details
 */
router.get('/farmer/active', async (_req: Request, res: Response) => {
  try {
    const result = await query(`SELECT * FROM farmers WHERE is_active = true ORDER BY created_at ASC LIMIT 1;`);
    if (result.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'No active farmer found.' });
    }
    res.status(200).json({ status: 'success', data: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err?.message });
  }
});

/**
 * @route   GET /api/advisories/farms
 * @desc    Get farms for active farmer
 */
router.get('/farms', async (req: Request, res: Response) => {
  try {
    const farmerId = req.query.farmerId as string | undefined;
    let result;
    if (farmerId) {
      result = await query(`SELECT * FROM farms WHERE farmer_id = $1 AND is_active = true;`, [farmerId]);
    } else {
      result = await query(`SELECT * FROM farms WHERE is_active = true;`);
    }
    res.status(200).json({ status: 'success', data: result.rows });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err?.message });
  }
});

/**
 * @route   GET /api/advisories/crop-cycles
 * @desc    Get crop cycles for farm or crop
 */
router.get('/crop-cycles', async (req: Request, res: Response) => {
  try {
    const farmId = req.query.farmId as string | undefined;
    const cropId = req.query.cropId as string | undefined;
    let sql = `SELECT * FROM crop_cycles WHERE 1=1`;
    const params: any[] = [];
    if (farmId) {
      params.push(farmId);
      sql += ` AND farm_id = $${params.length}`;
    }
    if (cropId) {
      params.push(cropId.toLowerCase());
      sql += ` AND LOWER(crop_id) = $${params.length}`;
    }
    sql += ` ORDER BY created_at DESC;`;
    const result = await query(sql, params);
    res.status(200).json({ status: 'success', data: result.rows });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err?.message });
  }
});

/**
 * @route   GET /api/advisories/soil-tests/latest
 * @desc    Get latest soil test record
 */
router.get('/soil-tests/latest', async (req: Request, res: Response) => {
  try {
    const farmId = req.query.farmId as string | undefined;
    let sql = `SELECT * FROM soil_tests WHERE status = 'valid'`;
    const params: any[] = [];
    if (farmId) {
      params.push(farmId);
      sql += ` AND farm_id = $${params.length}`;
    }
    sql += ` ORDER BY sample_date DESC, created_at DESC LIMIT 1;`;
    const result = await query(sql, params);
    if (result.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'No valid soil test found.' });
    }
    res.status(200).json({ status: 'success', data: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err?.message });
  }
});

/**
 * @route   GET /api/advisories/crops or /api/advisory/crops
 * @desc    Get supported crops list with agronomic profiles
 * @access  Public
 */
router.get('/crops', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    data: [
      { id: 'tomato', name: 'Tomato', season: 'Rabi / Kharif', defaultYield: 25.0, yieldUnit: 'Tonnes/Acre' },
      { id: 'cotton', name: 'Cotton', season: 'Kharif', defaultYield: 1.5, yieldUnit: 'Tonnes/Acre' },
      { id: 'soybean', name: 'Soybean', season: 'Kharif', defaultYield: 1.2, yieldUnit: 'Tonnes/Acre' },
      { id: 'sugarcane', name: 'Sugarcane', season: 'Annual', defaultYield: 45.0, yieldUnit: 'Tonnes/Acre' }
    ]
  });
});

/**
 * @route   POST /api/advisories/calculate or /api/advisory/calculate
 * @desc    Calculate fertilizer recommendations based on crop, farm area, soil NPK, pH, and target yield
 * @access  Public
 */
router.post('/calculate', async (req: Request, res: Response) => {
  try {
    const body = req.body || {};

    // Support multiple field naming conventions (camelCase, snake_case, short codes)
    const crop = body.crop || body.crop_name || body.cropId;
    const farmArea = body.farmArea ?? body.farm_area ?? body.acres ?? body.area;
    const soilN = body.soilN ?? body.nitrogen ?? body.soil_n ?? body.n;
    const soilP = body.soilP ?? body.phosphorus ?? body.soil_p ?? body.p;
    const soilK = body.soilK ?? body.potassium ?? body.soil_k ?? body.k;
    const soilPh = body.soilPh ?? body.ph ?? body.soil_ph;
    const targetYield = body.targetYield ?? body.target_yield ?? body.yield;

    // Validation
    const validationErrors: string[] = [];

    if (!crop || typeof crop !== 'string' || crop.trim() === '') {
      validationErrors.push("Field 'crop' is required and must be a valid string (e.g. 'tomato').");
    }

    if (farmArea === undefined || farmArea === null || isNaN(Number(farmArea)) || Number(farmArea) <= 0) {
      validationErrors.push("Field 'farmArea' (or 'farm_area' / 'acres') is required and must be a positive number.");
    }

    if (soilN === undefined || soilN === null || isNaN(Number(soilN)) || Number(soilN) < 0) {
      validationErrors.push("Field 'soilN' (or 'nitrogen' / 'soil_n' / 'n') is required and must be a non-negative number.");
    }

    if (soilP === undefined || soilP === null || isNaN(Number(soilP)) || Number(soilP) < 0) {
      validationErrors.push("Field 'soilP' (or 'phosphorus' / 'soil_p' / 'p') is required and must be a non-negative number.");
    }

    if (soilK === undefined || soilK === null || isNaN(Number(soilK)) || Number(soilK) < 0) {
      validationErrors.push("Field 'soilK' (or 'potassium' / 'soil_k' / 'k') is required and must be a non-negative number.");
    }

    if (soilPh === undefined || soilPh === null || isNaN(Number(soilPh)) || Number(soilPh) < 0 || Number(soilPh) > 14) {
      validationErrors.push("Field 'soilPh' (or 'ph' / 'soil_ph') is required and must be a number between 0 and 14.");
    }

    if (targetYield !== undefined && targetYield !== null && (isNaN(Number(targetYield)) || Number(targetYield) <= 0)) {
      validationErrors.push("Field 'targetYield' (or 'target_yield'), when provided, must be a positive number.");
    }

    if (validationErrors.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid input parameters for fertilizer calculation.',
        errors: validationErrors,
      });
    }

    const inputData: CalculateAdvisoryInput = {
      crop: String(crop).trim(),
      farmArea: Number(farmArea),
      soilN: Number(soilN),
      soilP: Number(soilP),
      soilK: Number(soilK),
      soilPh: Number(soilPh),
      targetYield: targetYield !== undefined && targetYield !== null ? Number(targetYield) : undefined,
    };

    const calculation = await calculateFertilizerAdvisory(inputData);

    return res.status(200).json({
      status: 'success',
      message: `Fertilizer recommendation generated successfully for ${calculation.inputSummary.cropDisplayName}`,
      data: calculation,
    });
  } catch (error: any) {
    console.error('[Advisory Calculate Error]:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to calculate fertilizer recommendations.',
      error: process.env.NODE_ENV === 'development' ? error?.message : undefined,
    });
  }
});

export default router;
