// ARQUIVO: src/hooks/useStudentDocuments.ts
// DESCRIÇÃO: Hook customizado para gerenciar o carregamento e estado dos documentos de um aluno
// RESPONSABILIDADE: "Cérebro" - Toda a lógica de busca e gerenciamento de estado

import { useState, useEffect } from 'react';
import { useDataProvider, useNotify } from 'react-admin';

// =====================================================================
// TIPOS E INTERFACES
// =====================================================================
interface DocumentExtraction {
    id: string;
    file_name: string;
    storage_path: string;
    document_type: string;
    status: string;
    enrollment_id: string;
    uploaded_at?: string;
}

interface UseStudentDocumentsReturn {
    documents: DocumentExtraction[];
    selectedDocument: DocumentExtraction | null;
    setSelectedDocument: (doc: DocumentExtraction | null) => void;
    loading: boolean;
    error: string | null;
    documentUrl: string;
}

// =====================================================================
// HOOK CUSTOMIZADO PRINCIPAL
// =====================================================================
export const useStudentDocuments = (studentId: string | undefined): UseStudentDocumentsReturn => {
    const [documents, setDocuments] = useState<DocumentExtraction[]>([]);
    const [selectedDocument, setSelectedDocument] = useState<DocumentExtraction | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [documentUrl, setDocumentUrl] = useState<string>('');
    
    const dataProvider = useDataProvider();
    const notify = useNotify();

    // =====================================================================
    // EFEITO PRINCIPAL - BUSCA DOS DOCUMENTOS
    // =====================================================================
    useEffect(() => {
        const fetchDocuments = async () => {
            if (!studentId) {
                setLoading(false);
                setError('ID do estudante não fornecido');
                return;
            }

            try {
                setLoading(true);
                setError(null);
                console.log('📄 [useStudentDocuments] Iniciando busca para studentId:', studentId);
                
                // PASSO 1: Buscar matrícula mais recente do aluno
                console.log('📄 [useStudentDocuments] Passo 1: Buscando matrícula...');
                const enrollmentResponse = await dataProvider.getList('enrollments', {
                    filter: { student_id: studentId },
                    pagination: { page: 1, perPage: 10 },
                    sort: { field: 'created_at', order: 'DESC' }
                });

                let finalDocuments: DocumentExtraction[] = [];

                if (enrollmentResponse.data.length > 0) {
                    // PASSO 2: Usar enrollment_id para buscar documentos
                    const enrollmentId = enrollmentResponse.data[0].id;
                    console.log('📄 [useStudentDocuments] Passo 2: Enrollment encontrado:', enrollmentId);
                    console.log('📄 [useStudentDocuments] Passo 3: Buscando documentos...');
                    
                    const documentsResponse = await dataProvider.getList('document_extractions', {
                        filter: { enrollment_id: enrollmentId },
                        pagination: { page: 1, perPage: 100 },
                        sort: { field: 'uploaded_at', order: 'DESC' }
                    });
                    
                    finalDocuments = documentsResponse.data;
                    console.log('📄 [useStudentDocuments] Documentos encontrados via enrollment:', finalDocuments.length);
                } else {
                    // FALLBACK: Buscar documentos diretamente (caso não haja enrollment)
                    console.log('📄 [useStudentDocuments] Fallback: Nenhum enrollment encontrado, buscando documentos diretos');
                    const directDocumentsResponse = await dataProvider.getList('document_extractions', {
                        filter: { enrollment_id: studentId }, // Algumas implementações podem usar student_id diretamente
                        pagination: { page: 1, perPage: 100 },
                        sort: { field: 'uploaded_at', order: 'DESC' }
                    });
                    
                    finalDocuments = directDocumentsResponse.data;
                    console.log('📄 [useStudentDocuments] Documentos encontrados diretos:', finalDocuments.length);
                }
                
                // PASSO 3: Definir dados no estado
                setDocuments(finalDocuments);
                
                // Auto-selecionar o primeiro documento se existir
                if (finalDocuments.length > 0) {
                    setSelectedDocument(finalDocuments[0]);
                    console.log('📄 [useStudentDocuments] Primeiro documento auto-selecionado:', finalDocuments[0].file_name);
                }

                console.log('✅ [useStudentDocuments] Busca concluída com sucesso');

            } catch (error: any) {
                console.error('❌ [useStudentDocuments] Erro ao carregar documentos:', error);
                const errorMessage = error.message || 'Erro desconhecido ao carregar documentos';
                setError(errorMessage);
                notify(`Erro ao carregar documentos: ${errorMessage}`, { type: 'error' });
            } finally {
                setLoading(false);
            }
        };

        fetchDocuments();
    }, [studentId, dataProvider, notify]);

    // =====================================================================
    // EFEITO PARA GERAR URL DO DOCUMENTO SELECIONADO
    // =====================================================================
    useEffect(() => {
        if (selectedDocument?.storage_path) {
            console.log('📄 [useStudentDocuments] Gerando URL para:', selectedDocument.file_name);
            
            // Gerar URL pública do Supabase Storage
            const baseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
            const publicUrl = `${baseUrl}/storage/v1/object/public/documents/${selectedDocument.storage_path}`;
            
            setDocumentUrl(publicUrl);
            console.log('📄 [useStudentDocuments] URL gerada:', publicUrl);
        } else {
            setDocumentUrl('');
        }
    }, [selectedDocument]);

    // =====================================================================
    // RETORNO DO HOOK
    // =====================================================================
    return {
        documents,
        selectedDocument,
        setSelectedDocument,
        loading,
        error,
        documentUrl
    };
};