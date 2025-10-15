import express from 'express';
import { executeQuery } from '../services/databaseConnection.ts';

const router = express.Router();

// Get all sections
router.get('/sections', async (req, res) => {
  try {
    const sections = await executeQuery(`
      SELECT 
        id,
        section_name,
        state,
        county,
        section,
        township,
        range,
        str,
        gross_acres,
        net_mineral_acres,
        title_status,
        legal_description,
        created_at,
        updated_at
      FROM sections 
      ORDER BY section_name
    `);
    
    res.json(sections);
  } catch (error) {
    console.error('Error fetching sections:', error);
    res.status(500).json({ error: 'Failed to fetch sections' });
  }
});

// Get section by ID
router.get('/sections/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const sections = await executeQuery(
      'SELECT * FROM sections WHERE id = ?',
      [id]
    );
    
    if (sections.length === 0) {
      return res.status(404).json({ error: 'Section not found' });
    }
    
    res.json(sections[0]);
  } catch (error) {
    console.error('Error fetching section:', error);
    res.status(500).json({ error: 'Failed to fetch section' });
  }
});

// Create new section
router.post('/sections', async (req, res) => {
  try {
    const {
      section_name,
      state,
      county,
      section,
      township,
      range,
      str,
      gross_acres,
      net_mineral_acres,
      title_status,
      legal_description
    } = req.body;
    
    const result = await executeQuery(`
      INSERT INTO sections (
        section_name, state, county, section, township, range, str,
        gross_acres, net_mineral_acres, title_status, legal_description
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      section_name, state, county, section, township, range, str,
      gross_acres, net_mineral_acres, title_status, legal_description
    ]);
    
    res.status(201).json({ 
      id: result.insertId,
      message: 'Section created successfully' 
    });
  } catch (error) {
    console.error('Error creating section:', error);
    res.status(500).json({ error: 'Failed to create section' });
  }
});

// Update section
router.put('/sections/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      section_name,
      state,
      county,
      section,
      township,
      range,
      str,
      gross_acres,
      net_mineral_acres,
      title_status,
      legal_description
    } = req.body;
    
    await executeQuery(`
      UPDATE sections SET
        section_name = ?, state = ?, county = ?, section = ?, township = ?, range = ?, str = ?,
        gross_acres = ?, net_mineral_acres = ?, title_status = ?, legal_description = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      section_name, state, county, section, township, range, str,
      gross_acres, net_mineral_acres, title_status, legal_description, id
    ]);
    
    res.json({ message: 'Section updated successfully' });
  } catch (error) {
    console.error('Error updating section:', error);
    res.status(500).json({ error: 'Failed to update section' });
  }
});

// Delete section
router.delete('/sections/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await executeQuery('DELETE FROM sections WHERE id = ?', [id]);
    
    res.json({ message: 'Section deleted successfully' });
  } catch (error) {
    console.error('Error deleting section:', error);
    res.status(500).json({ error: 'Failed to delete section' });
  }
});

export default router;
