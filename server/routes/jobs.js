const express = require('express');
const router = express.Router();
const { getSupabase } = require('../db/supabase');

router.get('/', async (req, res) => {
    try {
        const supabase = await getSupabase();
        const { data: jobs, error } = await supabase.from('jobs').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        res.json(jobs || []);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', async (req, res) => {
    const { title, department, location, employment_type, description, required_skills, preferred_skills } = req.body;
    if (!title) return res.status(400).json({ error: 'Job title is required' });
    
    try {
        const supabase = await getSupabase();
        const { data: job, error } = await supabase.from('jobs').insert([{
            title, department: department || '', location: location || '', 
            employment_type: employment_type || 'Full Time', description: description || '',
            required_skills: required_skills || '', preferred_skills: preferred_skills || ''
        }]).select().single();
        
        if (error) throw error;
        res.status(201).json(job);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', async (req, res) => {
    try {
        const supabase = await getSupabase();
        
        // 1. Check if job exists
        const { data: job, error: checkError } = await supabase.from('jobs').select('id').eq('id', req.params.id).maybeSingle();
        if (checkError) throw checkError;
        if (!job) return res.status(404).json({ error: 'Job을 찾을 수 없습니다.' });
        
        // 2. Delete job
        const { error } = await supabase.from('jobs').delete().eq('id', req.params.id);
        if (error) throw error;
        
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
