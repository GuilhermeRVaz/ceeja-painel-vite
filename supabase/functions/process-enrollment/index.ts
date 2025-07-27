// ARQUIVO FINAL E CORRIGIDO: supabase/functions/process-enrollment/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    const { enrollment_id } = await req.json();
    if (!enrollment_id) throw new Error("enrollment_id não foi fornecido.");
    
    const { data: enrollment, error: fetchError } = await supabaseClient
      .from('enrollments').select('*').eq('id', enrollment_id).single();
    if (fetchError) throw fetchError;
    
    const { data: student, error: studentError } = await supabaseClient
      .from('students').upsert({ enrollment_id: enrollment.id }, { onConflict: 'enrollment_id' })
      .select('id').single();
    if (studentError) throw studentError;
    const studentId = student.id;
    console.log(`[EDGE FUNCTION] Prontuário OK. Student ID: ${studentId}`);

    // === ATUALIZA A MATRÍCULA COM O student_id PARA FAZER A LIGAÇÃO ===
    await supabaseClient.from('enrollments').update({ student_id: studentId }).eq('id', enrollment_id);
    console.log(`[EDGE FUNCTION] Tabela 'enrollments' atualizada com o student_id.`);

    const personalData = enrollment.confirmed_personal_data;
    const addressData = enrollment.confirmed_address_data;
    const schoolingData = enrollment.confirmed_schooling_data;
    
    // Agora, fazemos o upsert nas tabelas finais
    if (personalData) {
      delete personalData.user_id;
      // Adicionamos o student_id aos dados pessoais antes de salvar
      await supabaseClient.from('personal_data').upsert({ ...personalData, student_id: studentId }, { onConflict: 'student_id' });
      console.log("[EDGE FUNCTION] Dados pessoais salvos.");
    }
    if (addressData) {
      delete addressData.user_id;
      await supabaseClient.from('addresses').upsert({ ...addressData, student_id: studentId }, { onConflict: 'student_id' });
      console.log("[EDGE FUNCTION] Endereço salvo.");
    }
    if (schoolingData) {
      delete schoolingData.user_id;
      await supabaseClient.from('schooling_data').upsert({ ...schoolingData, student_id: studentId }, { onConflict: 'student_id' });
      console.log("[EDGE FUNCTION] Dados escolares salvos.");
    }

    return new Response(JSON.stringify({ message: "Dados processados com sucesso!" }), { status: 200 });
  } catch (error) {
    console.error("[EDGE FUNCTION] ERRO CAPTURADO:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});