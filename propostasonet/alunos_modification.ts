// MODIFICAÇÃO PARA: src/resources/alunos.tsx
// DESCRIÇÃO: Integração do novo componente DocumentViewer na aba "Documentos"

// =====================================================================
// 1. ADICIONAR IMPORT NO TOPO DO ARQUIVO (após os outros imports)
// =====================================================================
import { DocumentViewer } from './DocumentViewer';

// =====================================================================
// 2. SUBSTITUIR A FormTab "Documentos" EXISTENTE POR:
// =====================================================================
<FormTab label="Documentos">
    <Box p={2}>
        <Typography variant="h6" gutterBottom color="primary">
            Verificação de Documentos
        </Typography>
        <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
            Compare os documentos escaneados com os dados preenchidos no formulário
        </Typography>
        
        {mergedData?.student_id || mergedData?.id ? (
            <DocumentViewer 
                studentId={String(mergedData.student_id || mergedData.id)} 
            />
        ) : (
            <Alert severity="warning">
                ID do estudante não encontrado para carregar documentos.
            </Alert>
        )}
    </Box>
</FormTab>

// =====================================================================
// OBSERVAÇÕES IMPORTANTES:
// =====================================================================
// 1. O import deve ser adicionado no topo do arquivo alunos.tsx
// 2. A FormTab completa deve substituir a existente
// 3. Usamos mergedData (que já existe no componente) ao invés de "record"
// 4. Convertemos para string para garantir compatibilidade com o hook