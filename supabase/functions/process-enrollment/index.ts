import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { enrollment_id } = await req.json();
    if (!enrollment_id) throw new Error("enrollment_id não foi fornecido.");

    console.log(`[EDGE FUNCTION] Processando matrícula com ID: ${enrollment_id}`);

    // Buscar matrícula
    const { data: enrollment, error: fetchError } = await supabaseClient
      .from('enrollments')
      .select('*')
      .eq('id', enrollment_id)
      .single();
    if (fetchError) throw fetchError;

    // Upsert do student
    const { data: student, error: studentError } = await supabaseClient
      .from('students')
      .upsert({ enrollment_id: enrollment.id }, { onConflict: 'enrollment_id' })
      .select('id')
      .single();
    if (studentError) throw studentError;
    const studentId = student.id;
    console.log(`[EDGE FUNCTION] Prontuário OK. Student ID: ${studentId}`);

    // NOVA ETAPA: Atualiza a matrícula com o student_id recém-criado
    const { error: updateEnrollmentError } = await supabaseClient
      .from('enrollments')
      .update({ student_id: studentId })
      .eq('id', enrollment_id);
    if (updateEnrollmentError) throw updateEnrollmentError;
    console.log(`[EDGE FUNCTION] Tabela 'enrollments' atualizada com o student_id.`);

    // Upsert dos dados pessoais
    const personalData = enrollment.confirmed_personal_data;
    if (personalData) {
      delete personalData.user_id;
      const { error } = await supabaseClient.from('personal_data')
        .upsert({ ...personalData, student_id: studentId }, { onConflict: 'student_id' });
      if (error) throw error;
      console.log("[EDGE FUNCTION] Dados pessoais salvos.");
    }

    // Upsert do endereço
    const addressData = enrollment.confirmed_address_data;
    if (addressData) {
      delete addressData.user_id;
      const correctedAddressData = {
        cep: addressData.cep,
        logradouro: addressData.logradouro,
        numero: addressData.numero,
        complemento: addressData.complemento,
        bairro: addressData.bairro,
        nomeCidade: addressData.nome_cidade ?? addressData.nomeCidade,
        ufCidade: addressData.uf_cidade ?? addressData.ufCidade,
        zona: addressData.zona,
        temLocalizacaoDiferenciada: addressData.tem_localizacao_diferenciada ?? addressData.temLocalizacaoDiferenciada,
        localizacaoDiferenciada: addressData.localizacao_diferenciada ?? addressData.localizacaoDiferenciada,
      };
      const { error } = await supabaseClient.from('addresses')
        .upsert({ ...correctedAddressData, student_id: studentId }, { onConflict: 'student_id' });
      if (error) throw error;
      console.log("[EDGE FUNCTION] Endereço salvo.");
    }

    // Upsert dos dados escolares
    const schoolingData = enrollment.confirmed_schooling_data;
    if (schoolingData) {
      delete schoolingData.user_id;
      const { error } = await supabaseClient.from('schooling_data')
        .upsert({ ...schoolingData, student_id: studentId }, { onConflict: 'student_id' });
      if (error) throw error;
      console.log("[EDGE FUNCTION] Dados escolares salvos.");
    }

    return new Response(JSON.stringify({ message: "Dados processados com sucesso!" }), { status: 200 });

  } catch (error) {
    console.error("[EDGE FUNCTION] ERRO CAPTURADO:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});