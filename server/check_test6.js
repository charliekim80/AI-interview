require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function checkTest6() {
  const { data: candidates, error } = await supabase
    .from('candidates')
    .select('id, name')
    .ilike('name', '%테스트%6%');

  if (error) {
    console.error('Error fetching candidate:', error);
    return;
  }

  console.log('Candidates found:', candidates);

  for (const c of candidates) {
    const { data: interviews } = await supabase
        .from('interviews')
        .select('answers, confirmed_questions')
        .eq('candidate_id', c.id);
    console.log(`\n--- Interviews for ${c.name} ---`);
    console.log(JSON.stringify(interviews, null, 2));
  }
}

checkTest6();
