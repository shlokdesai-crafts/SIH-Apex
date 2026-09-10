import { Router, Request, Response } from 'express';
import { query } from '../config/database.js';

const router = Router();

/**
 * @route   GET /api/fertilizers
 * @desc    Fetch active fertilizer products from PostgreSQL database
 * @access  Public
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { category, isOrganic } = req.query;

    let sql = `
      SELECT 
        id,
        product_code,
        name,
        category,
        formula,
        composition,
        standard_package_size_kg as "packageSizeKg",
        package_unit as "packageUnit",
        subsidized_price_inr as "price",
        mrp_inr as "mrp",
        badge_text as "badge",
        bag_color_hex as "bagColor",
        description,
        is_organic as "isOrganic",
        is_active as "isActive",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM fertilizer_products
      WHERE is_active = TRUE
    `;

    const params: any[] = [];

    if (category && typeof category === 'string') {
      params.push(category);
      sql += ` AND LOWER(category) = LOWER($${params.length})`;
    }

    if (isOrganic !== undefined) {
      params.push(isOrganic === 'true');
      sql += ` AND is_organic = $${params.length}`;
    }

    sql += ` ORDER BY is_organic ASC, name ASC;`;

    const result = await query(sql, params);

    // Format numeric price and package size as clean numbers
    const formattedData = result.rows.map((row) => ({
      id: row.id,
      productCode: row.product_code,
      name: row.name,
      category: row.category,
      formula: row.formula || '',
      composition: row.composition,
      packageSizeKg: row.packageSizeKg ? parseFloat(row.packageSizeKg) : 50,
      packageUnit: row.packageUnit || 'kg',
      price: row.price ? parseFloat(row.price) : 0,
      mrp: row.mrp ? parseFloat(row.mrp) : 0,
      badge: row.badge || '',
      bagColor: row.bagColor || '#1e56a0',
      description: row.description || '',
      isOrganic: Boolean(row.isOrganic),
      isActive: Boolean(row.isActive),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));

    res.status(200).json({
      status: 'success',
      source: 'database',
      count: formattedData.length,
      data: formattedData,
    });
  } catch (error: any) {
    console.error('[Fertilizers API Error]:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve fertilizer products from database.',
      error: process.env.NODE_ENV === 'development' ? error?.message : undefined,
    });
  }
});

export default router;
