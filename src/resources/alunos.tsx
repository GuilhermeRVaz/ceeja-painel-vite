// ARQUIVO: src/resources/alunos.tsx - COCKPIT DE VERIFICAÇÃO DE MATRÍCULA
// DESCRIÇÃO: Implementação da arquitetura "Orquestrador" para carregamento e salvamento
// de dados relacionados (personal_data, addresses, schooling_data) sem conflitos

import React from 'react';
import { useParams } from 'react-router-dom';
import {
    List, Datagrid, TextField, EmailField, TextInput, Edit,
    TabbedForm, FormTab, DateInput, Toolbar, SaveButton, Button as RaButton,
    useNotify, Filter, useEditController, useRecordContext,
    useDataProvider, BooleanInput, SelectInput,
    ArrayInput, SimpleFormIterator,
} from "react-admin";
import { useQuery } from 'react-query';
import type { RaRecord } from 'react-admin';
import {
    Box, Typography, CircularProgress, Alert, Paper, Divider,
    List as MuiList, ListItemButton, ListItemText
} from '@mui/material';
import { DocumentViewer } from './DocumentViewer';

// =====================================================================
// TIPOS E CONSTANTES
// =====================================================================
interface MergedData extends RaRecord {
    student_id?: string | number;
    addresses?: any;
    schooling_data?: any;
    enrollment_id?: string;
}

// =====================================================================
// COMPONENTES DE UI
// =====================================================================
const CenterSpinner: React.FC<{ message?: string }> = ({ message = "Carregando..." }) => (
    <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} />
        <Typography variant="body1" sx={{ mt: 2 }}>{message}</Typography>
    </Box>
);

// =====================================================================
// BARRA DE FERRAMENTAS E FORMULÁRIO DE EDIÇÃO
// =====================================================================
const AlunoEditToolbar = () => {
    const record = useRecordContext();
    const notify = useNotify();
    const handleApproveAndAutomate = () => {
        if (!record) return;
        console.log('CHAMANDO API DO ROBÔ PLAYWRIGHT para o aluno ID:', record.id);
        notify('Automação na SED iniciada!', { type: 'info' });
    };
    return (
        <Toolbar>
            <SaveButton label="Salvar Todas as Alterações" />
            <Box sx={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
                <RaButton label="Aprovar e Iniciar Matrícula na SED" onClick={handleApproveAndAutomate} />
            </Box>
        </Toolbar>
    );
};

const AlunoEditView: React.FC<{ mergedData: MergedData }> = ({ mergedData }) => {
    console.log('🔍 Record no AlunoEditView:', mergedData);

    return (
        <TabbedForm record={mergedData} toolbar={<AlunoEditToolbar />}>
            <FormTab label="Dados Pessoais">
                <Box p={3}>
                    <Typography variant="h6" color="primary" gutterBottom>Identificação</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
                        <Box sx={{ flex: '1 1 60%', minWidth: '300px' }}><TextInput source="nome_completo" label="Nome Completo" fullWidth /></Box>
                        <Box sx={{ flex: '1 1 30%', minWidth: '150px' }}><TextInput source="idade" label="Idade" /></Box>
                        <Box sx={{ flex: '1 1 45%', minWidth: '200px' }}><BooleanInput source="tem_nome_social" label="Tem Nome Social?" /></Box>
                        <Box sx={{ flex: '1 1 45%', minWidth: '200px' }}><TextInput source="nome_social" label="Nome Social" fullWidth /></Box>
                        <Box sx={{ flex: '1 1 45%', minWidth: '200px' }}><BooleanInput source="tem_nome_afetivo" label="Tem Nome Afetivo?" /></Box>
                        <Box sx={{ flex: '1 1 45%', minWidth: '200px' }}><TextInput source="nome_afetivo" label="Nome Afetivo" fullWidth /></Box>
                        <Box sx={{ flex: '1 1 30%', minWidth: '150px' }}><SelectInput source="sexo" label="Sexo" choices={[{ id: "Masculino", name: "Masculino" }, { id: "Feminino", name: "Feminino" }]} /></Box>
                        <Box sx={{ flex: '1 1 30%', minWidth: '150px' }}><DateInput source="data_nascimento" label="Data de Nascimento" /></Box>
                        <Box sx={{ flex: '1 1 30%', minWidth: '150px' }}><TextInput source="raca_cor" label="Raça/Cor" /></Box>
                    </Box>

                    <Typography variant="h6" color="primary" sx={{ mt: 3, mb: 1 }}>Documentos</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
                        <Box sx={{ flex: '1 1 30%', minWidth: '150px' }}><TextInput source="rg" label="RG" /></Box>
                        <Box sx={{ flex: '1 1 15%', minWidth: '100px' }}><TextInput source="rg_digito" label="Dígito" /></Box>
                        <Box sx={{ flex: '1 1 15%', minWidth: '100px' }}><TextInput source="rg_uf" label="UF" /></Box>
                        <Box sx={{ flex: '1 1 30%', minWidth: '150px' }}><DateInput source="rg_data_emissao" label="Data de Emissão" /></Box>
                        <Box sx={{ flex: '1 1 45%', minWidth: '200px' }}><TextInput source="cpf" label="CPF" /></Box>
                        <Box sx={{ flex: '1 1 45%', minWidth: '200px' }}><TextInput source="telefone" label="Telefone" /></Box>
                        <Box sx={{ flex: '1 1 100%', minWidth: '300px' }}><TextInput source="email" label="E-mail" fullWidth /></Box>
                    </Box>

                    <Typography variant="h6" color="primary" sx={{ mt: 3, mb: 1 }}>Filiação e Origem</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
                        <Box sx={{ flex: '1 1 100%', minWidth: '300px' }}><TextInput source="nome_mae" label="Nome da Mãe" fullWidth /></Box>
                        <Box sx={{ flex: '1 1 100%', minWidth: '300px' }}><TextInput source="nome_pai" label="Nome do Pai" fullWidth /></Box>
                        <Box sx={{ flex: '1 1 30%', minWidth: '150px' }}><TextInput source="nacionalidade" label="Nacionalidade" /></Box>
                        <Box sx={{ flex: '1 1 30%', minWidth: '150px' }}><TextInput source="nascimento_uf" label="UF de Nascimento" /></Box>
                        <Box sx={{ flex: '1 1 30%', minWidth: '150px' }}><TextInput source="nascimento_cidade" label="Cidade de Nascimento" /></Box>
                    </Box>
                </Box>
            </FormTab>

            <FormTab label="Endereço">
                <Box p={3}>
                    <Typography variant="h6" color="primary" gutterBottom>Endereço Residencial</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
                        <Box sx={{ flex: '1 1 20%', minWidth: '150px' }}><TextInput source="addresses.cep" label="CEP" /></Box>
                        <Box sx={{ flex: '1 1 55%', minWidth: '300px' }}><TextInput source="addresses.logradouro" label="Logradouro" fullWidth /></Box>
                        <Box sx={{ flex: '1 1 20%', minWidth: '100px' }}><TextInput source="addresses.numero" label="Número" /></Box>
                        <Box sx={{ flex: '1 1 100%', minWidth: '300px' }}><TextInput source="addresses.complemento" label="Complemento" fullWidth /></Box>
                        <Box sx={{ flex: '1 1 30%', minWidth: '150px' }}><TextInput source="addresses.bairro" label="Bairro" /></Box>
                        <Box sx={{ flex: '1 1 30%', minWidth: '150px' }}><TextInput source="addresses.nomeCidade" label="Cidade" /></Box>
                        <Box sx={{ flex: '1 1 15%', minWidth: '100px' }}><TextInput source="addresses.ufCidade" label="UF" /></Box>
                        <Box sx={{ flex: '1 1 15%', minWidth: '100px' }}><SelectInput source="addresses.zona" label="Zona" choices={[{ id: "Urbana", name: "Urbana" }, { id: "Rural", name: "Rural" }]} /></Box>
                    </Box>
                </Box>
            </FormTab>

            <FormTab label="Escolaridade">
                <Box p={3}>
                    <Typography variant="h6" color="primary" gutterBottom>Dados de Escolaridade</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
                        <Box sx={{ flex: '1 1 45%', minWidth: '200px' }}><TextInput source="schooling_data.nivel_ensino" label="Nível de Ensino" /></Box>
                        <Box sx={{ flex: '1 1 45%', minWidth: '200px' }}><TextInput source="schooling_data.itinerario_formativo" label="Itinerário Formativo" /></Box>
                        <Box sx={{ flex: '1 1 45%', minWidth: '200px' }}><TextInput source="schooling_data.ultima_serie_concluida" label="Última Série Concluída" /></Box>
                        <Box sx={{ flex: '1 1 45%', minWidth: '200px' }}><TextInput source="schooling_data.ra" label="RA" /></Box>
                        <Box sx={{ flex: '1 1 30%', minWidth: '150px' }}><BooleanInput source="schooling_data.estudou_no_ceeja" label="Estudou no CEEJA?" /></Box>
                        <Box sx={{ flex: '1 1 30%', minWidth: '150px' }}><BooleanInput source="schooling_data.tem_progressao_parcial" label="Tem Progressão Parcial?" /></Box>
                        <Box sx={{ flex: '1 1 30%', minWidth: '150px' }}><BooleanInput source="schooling_data.eliminou_disciplina" label="Eliminou Disciplina?" /></Box>
                        <Box sx={{ flex: '1 1 100%', minWidth: '300px' }}><TextInput source="schooling_data.nome_escola" label="Nome da Escola" fullWidth /></Box>
                        <Box sx={{ flex: '1 1 45%', minWidth: '200px' }}><SelectInput source="schooling_data.tipo_escola" label="Tipo de Escola" choices={[{ id: "Pública", name: "Pública" }, { id: "Privada", name: "Privada" }]} /></Box>
                    </Box>
                    <Box mt={2}>
                        <Typography variant="subtitle1" gutterBottom>Disciplinas em Dependência</Typography>
                        <ArrayInput source="schooling_data.progressao_parcial_disciplinas">
                            <SimpleFormIterator>
                                <TextInput source="disciplina" label="Disciplina em DP" />
                            </SimpleFormIterator>
                        </ArrayInput>
                    </Box>
                </Box>
            </FormTab>

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
        </TabbedForm>
    );
};

// =====================================================================
// HOOK PERSONALIZADO PARA CARREGAR DADOS MESCLADOS COM REACT-QUERY
// =====================================================================
const useMergedStudentData = (personalDataRecord: any) => {
    const dataProvider = useDataProvider();
    
    return useQuery(
        ['mergedStudentData', personalDataRecord?.id],
        async () => {
            if (!personalDataRecord?.id) {
                throw new Error('ID do registro não encontrado');
            }

            const studentId = personalDataRecord.student_id || personalDataRecord.id;
            console.log('🔍 Buscando dados relacionados para studentId:', studentId);
            
            // Buscar dados relacionados em paralelo
            const [addressesRes, schoolingRes] = await Promise.all([
                dataProvider.getList('addresses', { 
                    filter: { student_id: studentId }, 
                    pagination: { page: 1, perPage: 1 }, 
                    sort: { field: 'id', order: 'ASC' } 
                }),
                dataProvider.getList('schooling_data', { 
                    filter: { student_id: studentId }, 
                    pagination: { page: 1, perPage: 1 }, 
                    sort: { field: 'id', order: 'ASC' } 
                })
            ]);

            console.log('🔍 Dados de endereço:', addressesRes.data);
            console.log('🔍 Dados de escolaridade:', schoolingRes.data);

            const merged = {
                ...personalDataRecord,
                addresses: addressesRes.data.length > 0 ? addressesRes.data[0] : {},
                schooling_data: schoolingRes.data.length > 0 ? schoolingRes.data[0] : {},
            };
            
            console.log('✅ Dados mesclados:', merged);
            return merged;
        },
        {
            enabled: !!personalDataRecord?.id,
            staleTime: 5 * 60 * 1000, // 5 minutos
            cacheTime: 10 * 60 * 1000, // 10 minutos
        }
    );
};

// =====================================================================
// COMPONENTE ORQUESTRADOR PRINCIPAL
// =====================================================================
export const AlunoEdit = () => {
    const { id } = useParams<{ id: string }>();
    const dataProvider = useDataProvider();
    const notify = useNotify();
    
    // Usar o useEditController para buscar o registro principal
    const { record: personalDataRecord, isLoading: personalLoading, error: personalError } = useEditController({
        resource: 'personal_data',
        id: id!
    });

    // Usar react-query para orquestrar o carregamento dos dados relacionados
    const { data: mergedData, isLoading: relatedLoading, error: relatedError } = useMergedStudentData(personalDataRecord);

    // Função de transformação para salvar os dados
    const transform = async (data: MergedData) => {
        try {
            console.log('💾 Transform iniciado com dados:', data);
            
            // Clonar os dados para evitar mutação do estado original
            const dataToSave = { ...data };

            // Extrair os dados aninhados do objeto principal
            const addresses = dataToSave.addresses;
            const schooling_data = dataToSave.schooling_data;
            
            // Remover os objetos aninhados do payload de personal_data
            delete dataToSave.addresses;
            delete dataToSave.schooling_data;
            
            const personal_data = dataToSave;
            const studentId = personal_data.student_id || personal_data.id;

            console.log('💾 Dados separados:', {
                personal_keys: Object.keys(personal_data),
                addresses_keys: Object.keys(addresses || {}),
                schooling_keys: Object.keys(schooling_data || {})
            });

            const updates = [];
            
            // 1. SEMPRE atualiza os dados pessoais (agora limpos)
            console.log('💾 Salvando dados pessoais limpos:', personal_data);
            updates.push(
                dataProvider.update('personal_data', {
                    id: personal_data.id,
                    data: personal_data,
                    previousData: personalDataRecord!
                })
            );

            // 2. Salvar endereço (CREATE ou UPDATE)
            if (addresses && Object.keys(addresses).length > 0) {
                const addressPayload = { ...addresses, student_id: studentId };
                if (addresses.id) {
                    console.log('🏠 Atualizando endereço existente ID:', addresses.id);
                    updates.push(
                        dataProvider.update('addresses', {
                            id: addresses.id,
                            data: addressPayload,
                            previousData: mergedData!.addresses
                        })
                    );
                } else {
                    console.log('🏠 Criando novo endereço');
                    updates.push(
                        dataProvider.create('addresses', { data: addressPayload })
                    );
                }
            }

            // 3. Salvar dados de escolaridade (CREATE ou UPDATE)
            if (schooling_data && Object.keys(schooling_data).length > 0) {
                const schoolingPayload = { ...schooling_data, student_id: studentId };
                if (schooling_data.id) {
                    console.log('🎓 Atualizando escolaridade existente ID:', schooling_data.id);
                    updates.push(
                        dataProvider.update('schooling_data', {
                            id: schooling_data.id,
                            data: schoolingPayload,
                            previousData: mergedData!.schooling_data
                        })
                    );
                } else {
                    console.log('🎓 Criando nova escolaridade');
                    updates.push(
                        dataProvider.create('schooling_data', { data: schoolingPayload })
                    );
                }
            }

            // 4. Executar todas as operações
            console.log(`🚀 Executando ${updates.length} operações...`);
            await Promise.all(updates);
            
            console.log('✅ Todas as alterações foram salvas!');
            notify('Alterações salvas com sucesso!', { type: 'success' });
            
        } catch (error: any) {
            console.error('❌ Erro ao salvar:', error);
            notify(`Erro ao salvar: ${error.message}`, { type: 'error' });
            throw error;
        }
        
        return data;
    };

    // Estados de loading e erro
    const isLoading = personalLoading || relatedLoading;
    const error = personalError || relatedError;
    
    if (isLoading) {
        return <CenterSpinner message="Carregando dados do aluno..." />;
    }
    
    if (error || !mergedData) {
        return (
            <Alert severity="error">
                { (error as any)?.message || 'Erro ao carregar dados do aluno' }
            </Alert>
        );
    }

    return (
        <Edit
            resource="personal_data"
            id={id}
            record={mergedData}
            transform={transform}
            mutationMode="pessimistic"
        >
            <AlunoEditView mergedData={mergedData} />
        </Edit>
    );
};

// =====================================================================
// LISTA E FILTRO DE ALUNOS
// =====================================================================
const AlunoFilter = (props: any) => (
    <Filter {...props}>
        <TextInput label="Buscar por Nome" source="nome_completo@ilike" alwaysOn />
        <TextInput label="Buscar por CPF" source="cpf@eq" />
    </Filter>
);

export const AlunoList = () => (
    <List filters={<AlunoFilter />} resource="personal_data" title="Cockpit de Verificação" perPage={25}>
        <Datagrid rowClick="edit">
            <TextField source="nome_completo" label="Nome Completo" />
            <EmailField source="email" label="E-mail" />
            <TextField source="cpf" label="CPF" />
            <TextField source="telefone" label="Telefone" />
        </Datagrid>
    </List>
);