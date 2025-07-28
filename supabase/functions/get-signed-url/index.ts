import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Define os cabeçalhos CORS para permitir requisições de qualquer origem.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Função Edge para gerar URLs assinadas de forma segura usando a chave de serviço.
Deno.serve(async (req) => {
  // O navegador envia uma requisição "preflight" OPTIONS antes da requisição POST.
  // Precisamos responder a ela com os cabeçalhos CORS para que a requisição principal seja permitida.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Cria um cliente Supabase com permissões de administrador.
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Extrai o caminho do arquivo do corpo da requisição.
    const { path } = await req.json();
    if (!path) {
      throw new Error("O caminho do arquivo (path) não foi fornecido.");
    }

    console.log(`[get-signed-url] Gerando URL para o caminho: ${path}`);

    // Gera a URL assinada para o bucket 'documents'.
    const { data, error } = await supabaseClient.storage
      .from('documents')
      .createSignedUrl(path, 3600); // URL válida por 1 hora

    if (error) {
      console.error('[get-signed-url] Erro ao criar URL assinada:', error);
      throw error;
    }

    // Retorna a URL assinada, incluindo os cabeçalhos CORS na resposta.
    return new Response(
      JSON.stringify({ signedUrl: data.signedUrl }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    // Em caso de erro, retorna a mensagem de erro, também com os cabeçalhos CORS.
    console.error("[get-signed-url] Erro geral capturado:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});