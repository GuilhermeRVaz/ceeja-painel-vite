import { useState, useEffect } from 'react';
import { useDataProvider, useNotify } from 'react-admin';
import { supabase } from '../supabase/supabaseClient';

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
    noDocumentsFound: boolean;
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
    const [noDocumentsFound, setNoDocumentsFound] = useState(false);
    
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

                let enrollmentId: string | null = null;

                // Estratégia 1: Buscar o student para obter o enrollment_id diretamente.
                console.log('📄 [useStudentDocuments] Estratégia 1: Buscando student pelo ID para obter enrollment_id.');
                try {
                    const studentResponse = await dataProvider.getList('students', {
                        filter: { id: studentId },
                        pagination: { page: 1, perPage: 1 }
                    });
                    if (studentResponse?.data?.length > 0 && studentResponse.data[0].enrollment_id) {
                        enrollmentId = studentResponse.data[0].enrollment_id;
                        console.log('📄 [useStudentDocuments] Sucesso na Estratégia 1. Enrollment ID encontrado:', enrollmentId);
                    } else {
                        console.log('📄 [useStudentDocuments] Estratégia 1 não encontrou enrollment_id no registro do student.');
                    }
                } catch (e) {
                    console.warn('📄 [useStudentDocuments] Estratégia 1 falhou (pode ser que "students" não seja um recurso válido):', e);
                }

                // Estratégia 2 (Fallback): Se a primeira falhar, tentar buscar na tabela de enrollments.
                if (!enrollmentId) {
                    console.log('📄 [useStudentDocuments] Estratégia 2: Buscando na tabela de enrollments por student_id.');
                    try {
                        const enrollmentResponse = await dataProvider.getList('enrollments', {
                            filter: { student_id: studentId },
                            pagination: { page: 1, perPage: 1 },
                            sort: { field: 'created_at', order: 'DESC' }
                        });

                        if (enrollmentResponse.data.length > 0) {
                            enrollmentId = enrollmentResponse.data[0].id;
                            console.log('📄 [useStudentDocuments] Sucesso na Estratégia 2. Enrollment ID encontrado:', enrollmentId);
                        } else {
                            console.log('📄 [useStudentDocuments] Estratégia 2 também não encontrou enrollments.');
                        }
                    } catch (e) {
                        console.warn('📄 [useStudentDocuments] Estratégia 2 falhou:', e);
                    }
                }

                let finalDocuments: DocumentExtraction[] = [];

                // Se um enrollmentId foi encontrado por qualquer uma das estratégias, buscar os documentos.
                if (enrollmentId) {
                    console.log(`📄 [useStudentDocuments] Buscando documentos com o enrollment_id: ${enrollmentId}`);
                    const documentsResponse = await dataProvider.getList('document_extractions', {
                        filter: { enrollment_id: enrollmentId },
                        pagination: { page: 1, perPage: 100 },
                        sort: { field: 'uploaded_at', order: 'DESC' }
                    });
                    finalDocuments = documentsResponse.data;
                    console.log('📄 [useStudentDocuments] Documentos encontrados:', finalDocuments.length);
                } else {
                    console.log('⚠️ [useStudentDocuments] Nenhuma das estratégias encontrou um enrollment_id. Não é possível buscar documentos.');
                }

                setDocuments(finalDocuments);
                setNoDocumentsFound(finalDocuments.length === 0 && !!enrollmentId);

                if (finalDocuments.length > 0) {
                    setSelectedDocument(finalDocuments[0]);
                    console.log('📄 [useStudentDocuments] Primeiro documento auto-selecionado:', finalDocuments[0].file_name);
                } else if (!enrollmentId) {
                    setError('Não foi possível encontrar uma matrícula associada a este aluno para buscar os documentos.');
                    setNoDocumentsFound(false);
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
        const fetchSignedUrlViaFunction = async () => {
            if (selectedDocument?.storage_path) {
                console.log('📄 [useStudentDocuments] Chamando a Edge Function "get-signed-url" para:', selectedDocument.storage_path);
                setDocumentUrl('');

                try {
                    const { data, error } = await supabase.functions.invoke('get-signed-url', {
                        body: { path: selectedDocument.storage_path },
                    });

                    if (error) throw error;

                    if (data.signedUrl) {
                        console.log('📄 [useStudentDocuments] URL assinada recebida da Edge Function.');
                        setDocumentUrl(data.signedUrl);
                    } else {
                        throw new Error("A resposta da função não continha uma URL assinada.");
                    }
                } catch (error: any) {
                    console.error('❌ [useStudentDocuments] Erro ao chamar a Edge Function:', error);
                    setError(`Falha ao obter URL segura: ${error.message}`);
                    notify('Não foi possível carregar o documento. Verifique o console.', { type: 'error' });
                    setDocumentUrl('');
                }
            } else {
                setDocumentUrl('');
            }
        };

        fetchSignedUrlViaFunction();
    }, [selectedDocument, notify]);

    // =====================================================================
    // RETORNO DO HOOK
    // =====================================================================
    return {
        documents,
        selectedDocument,
        setSelectedDocument,
        loading,
        error,
        documentUrl,
        noDocumentsFound
    };
};