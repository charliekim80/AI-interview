const { getSupabase } = require('./db/supabase');

async function checkKimSurvey() {
  try {
    const supabase = await getSupabase();
    const { data: interview } = await supabase.from('interviews').select('id').eq('token', '36d6be95-89a5-464f-bf3b-5df80f27fba3').maybeSingle();
    if (!interview) {
      console.log('No interview found for the token.');
      return;
    }
    const { data, error } = await supabase.from('surveys').select('*').eq('interview_id', interview.id).maybeSingle();
    if (error) {
      console.error('Survey error:', error);
    } else {
      console.log('Survey data for Kim:', data);
    }
  } catch (err) {
    console.error(err);
  }
}

checkKimSurvey();
