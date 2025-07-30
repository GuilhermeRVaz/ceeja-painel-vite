// ARQUIVO: src/components/panels/PainelEdicao/AbaEscolaridade.tsx
// DESCRIÇÃO: Aba de edição de dados de escolaridade do aluno

import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    TextField,
    Grid,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Chip,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    FormControlLabel,
    Switch,
    useTheme,
    useMediaQuery
} from '@mui/material';
import {
    ExpandMore as ExpandMoreIcon,
    School as SchoolIcon,
    MenuBook as BookIcon,
    Assignment as AssignmentIcon,
    EmojiEvents as TrophyIcon
} from '@mui/icons-material';
import { useCockpitContext } from '../cockpit/CockpitLayout';

// =====================================================================
// INTERFACES
// =====================================================================
interface AbaEscolaridadeProps {
    schoolingData: any;
}

interface EscolaridadeFormData {
    // Escolaridade Atual
    nivel_ensino: string;
    serie_ano: string;
    turno_preferencia: string;
    modalidade: string;
    
    // Escola Anterior
    escola_anterior: string;
    escola_anterior_cidade: string;
    escola_anterior_uf: string;
    escola_anterior_tipo: string;
    ano_conclusao: string;
    
    // Histórico Escolar
    possui_historico: boolean;
    historico_observacoes: string;
    transferencia_pendente: boolean;
    documentos_pendentes: string;
    
    // Situação Acadêmica
    ja_estudou_eja: boolean;
    motivo_interrupcao: string;
    tempo_fora_escola: string;
    
    // Necessidades Especiais
    necessita_adaptacao: boolean;
    tipo_adaptacao: string;
    acompanhamento_especial: boolean;
    detalhes_acompanhamento: string;
    
    // Objetivos e Expectativas
    objetivo_curso: string;
    expectativas: string;
    areas_interesse: string;
    planos_pos_conclusao: string;
}

// =====================================================================
// DADOS AUXILIARES
// =====================================================================
const NIVEIS_ENSINO = [
    'Ensino Fundamental II (6º ao 9º ano)',
    'Ensino Médio (1º ao 3º ano)',
    'EJA - Ensino Fundamental',
    'EJA - Ensino Médio'
];

const SERIES_ANOS = [
    '6º ano', '7º ano', '8º ano', '9º ano',
    '1º ano EM', '2º ano EM', '3º ano EM',
    'Multisseriado'
];

const TURNOS = [
    'Manhã', 'Tarde', 'Noite', 'Integral', 'Sem preferência'
];

const MODALIDADES = [
    'Presencial', 'Semi-presencial', 'EAD', 'Híbrido'
];

const TIPOS_ESCOLA = [
    'Pública Estadual', 'Pública Municipal', 'Particular', 'Federal'
];

const MOTIVOS_INTERRUPCAO = [
    'Trabalho', 'Gravidez', 'Mudança de cidade', 'Problemas familiares',
    'Dificuldades financeiras', 'Problemas de saúde', 'Outro'
];

// =====================================================================
// COMPONENTE PRINCIPAL
// =====================================================================
export const AbaEscolaridade: React.FC<AbaEscolaridadeProps> = ({ schoolingData }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const { saveData } = useCockpitContext();
    
    // Estado do formulário
    const [formData, setFormData] = useState<EscolaridadeFormData>({
        // Valores padrão
        nivel_ensino: '',
        serie_ano: '',
        turno_preferencia: '',
        modalidade: 'Presencial',
        escola_anterior: '',
        escola_anterior_cidade: '',
        escola_anterior_uf: 'SP',
        escola_anterior_tipo: '',
        ano_conclusao: '',
        possui_historico: false,
        historico_observacoes: '',
        transferencia_pendente: false,
        documentos_pendentes: '',
        ja_estudou_eja: false,
        motivo_interrupcao: '',
        tempo_fora_escola: '',
        necessita_adaptacao: false,
        tipo_adaptacao: '',
        acompanhamento_especial: false,
        detalhes_acompanhamento: '',
        objetivo_curso: '',
        expectativas: '',
        areas_interesse: '',
        planos_pos_conclusao: ''
    });
    
    // Carregar dados de escolaridade no formulário
    useEffect(() => {
        if (schoolingData) {
            setFormData(prev => ({
                ...prev,
                ...schoolingData
            }));
        }
    }, [schoolingData]);
    
    // Handler para mudanças nos campos
    const handleFieldChange = (field: keyof EscolaridadeFormData) => (
        event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | any
    ) => {
        const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
        
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
        
        // Auto-save após 2 segundos de inatividade
        // TODO: Implementar debounce para auto-save
    };
    
    return (
        <Box sx={{ p: 2 }}>
            {/* Seção: Escolaridade Desejada */}
            <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <SchoolIcon color="primary" />
                        <Typography variant="h6">Escolaridade Desejada</Typography>
                        <Chip label="Obrigatório" size="small" color="error" />
                    </Box>
                </AccordionSummary>
                <AccordionDetails>
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth required>
                                <InputLabel>Nível de Ensino</InputLabel>
                                <Select
                                    value={formData.nivel_ensino}
                                    onChange={handleFieldChange('nivel_ensino')}
                                    label="Nível de Ensino"
                                >
                                    {NIVEIS_ENSINO.map(nivel => (
                                        <MenuItem key={nivel} value={nivel}>
                                            {nivel}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth required>
                                <InputLabel>Série/Ano</InputLabel>
                                <Select
                                    value={formData.serie_ano}
                                    onChange={handleFieldChange('serie_ano')}
                                    label="Série/Ano"
                                >
                                    {SERIES_ANOS.map(serie => (
                                        <MenuItem key={serie} value={serie}>
                                            {serie}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth required>
                                <InputLabel>Turno de Preferência</InputLabel>
                                <Select
                                    value={formData.turno_preferencia}
                                    onChange={handleFieldChange('turno_preferencia')}
                                    label="Turno de Preferência"
                                >
                                    {TURNOS.map(turno => (
                                        <MenuItem key={turno} value={turno}>
                                            {turno}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth>
                                <InputLabel>Modalidade</InputLabel>
                                <Select
                                    value={formData.modalidade}
                                    onChange={handleFieldChange('modalidade')}
                                    label="Modalidade"
                                >
                                    {MODALIDADES.map(modalidade => (
                                        <MenuItem key={modalidade} value={modalidade}>
                                            {modalidade}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>
                </AccordionDetails>
            </Accordion>
            
            {/* Seção: Escola Anterior */}
            <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <BookIcon color="primary" />
                        <Typography variant="h6">Escola Anterior</Typography>
                        <Chip label="Importante" size="small" color="warning" />
                    </Box>
                </AccordionSummary>
                <AccordionDetails>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Nome da Escola Anterior"
                                value={formData.escola_anterior}
                                onChange={handleFieldChange('escola_anterior')}
                                required
                                helperText="Nome completo da última escola onde estudou"
                            />
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Cidade da Escola"
                                value={formData.escola_anterior_cidade}
                                onChange={handleFieldChange('escola_anterior_cidade')}
                                required
                            />
                        </Grid>
                        
                        <Grid item xs={12} md={3}>
                            <TextField
                                fullWidth
                                label="UF"
                                value={formData.escola_anterior_uf}
                                onChange={handleFieldChange('escola_anterior_uf')}
                                required
                                inputProps={{ maxLength: 2 }}
                            />
                        </Grid>
                        
                        <Grid item xs={12} md={3}>
                            <TextField
                                fullWidth
                                label="Ano de Conclusão"
                                type="number"
                                value={formData.ano_conclusao}
                                onChange={handleFieldChange('ano_conclusao')}
                                inputProps={{ min: 1990, max: new Date().getFullYear() }}
                            />
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth>
                                <InputLabel>Tipo de Escola</InputLabel>
                                <Select
                                    value={formData.escola_anterior_tipo}
                                    onChange={handleFieldChange('escola_anterior_tipo')}
                                    label="Tipo de Escola"
                                >
                                    {TIPOS_ESCOLA.map(tipo => (
                                        <MenuItem key={tipo} value={tipo}>
                                            {tipo}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={formData.ja_estudou_eja}
                                        onChange={handleFieldChange('ja_estudou_eja')}
                                    />
                                }
                                label="Já estudou em EJA anteriormente"
                            />
                        </Grid>
                    </Grid>
                </AccordionDetails>
            </Accordion>
            
            {/* Seção: Documentação Escolar */}
            <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AssignmentIcon color="primary" />
                        <Typography variant="h6">Documentação Escolar</Typography>
                    </Box>
                </AccordionSummary>
                <AccordionDetails>
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={formData.possui_historico}
                                        onChange={handleFieldChange('possui_historico')}
                                    />
                                }
                                label="Possui histórico escolar"
                            />
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={formData.transferencia_pendente}
                                        onChange={handleFieldChange('transferencia_pendente')}
                                    />
                                }
                                label="Transferência pendente"
                            />
                        </Grid>
                        
                        {formData.possui_historico && (
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Observações sobre o Histórico"
                                    value={formData.historico_observacoes}
                                    onChange={handleFieldChange('historico_observacoes')}
                                    multiline
                                    rows={2}
                                    placeholder="Ex: Histórico incompleto, pendências, etc."
                                />
                            </Grid>
                        )}
                        
                        {formData.transferencia_pendente && (
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Documentos Pendentes"
                                    value={formData.documentos_pendentes}
                                    onChange={handleFieldChange('documentos_pendentes')}
                                    multiline
                                    rows={2}
                                    placeholder="Descreva quais documentos estão pendentes"
                                />
                            </Grid>
                        )}
                    </Grid>
                </AccordionDetails>
            </Accordion>
            
            {/* Seção: Histórico de Interrupção */}
            <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TrophyIcon color="primary" />
                        <Typography variant="h6">Histórico de Interrupção</Typography>
                    </Box>
                </AccordionSummary>
                <AccordionDetails>
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth>
                                <InputLabel>Motivo da Interrupção</InputLabel>
                                <Select
                                    value={formData.motivo_interrupcao}
                                    onChange={handleFieldChange('motivo_interrupcao')}
                                    label="Motivo da Interrupção"
                                >
                                    {MOTIVOS_INTERRUPCAO.map(motivo => (
                                        <MenuItem key={motivo} value={motivo}>
                                            {motivo}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Tempo Fora da Escola"
                                value={formData.tempo_fora_escola}
                                onChange={handleFieldChange('tempo_fora_escola')}
                                placeholder="Ex: 2 anos, 6 meses"
                                helperText="Quanto tempo ficou sem estudar"
                            />
                        </Grid>
                    </Grid>
                </AccordionDetails>
            </Accordion>
            
            {/* Seção: Necessidades Especiais */}
            <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AssignmentIcon color="primary" />
                        <Typography variant="h6">Necessidades Especiais</Typography>
                    </Box>
                </AccordionSummary>
                <AccordionDetails>
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={formData.necessita_adaptacao}
                                        onChange={handleFieldChange('necessita_adaptacao')}
                                    />
                                }
                                label="Necessita adaptações pedagógicas"
                            />
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={formData.acompanhamento_especial}
                                        onChange={handleFieldChange('acompanhamento_especial')}
                                    />
                                }
                                label="Necessita acompanhamento especial"
                            />
                        </Grid>
                        
                        {formData.necessita_adaptacao && (
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Tipo de Adaptação Necessária"
                                    value={formData.tipo_adaptacao}
                                    onChange={handleFieldChange('tipo_adaptacao')}
                                    multiline
                                    rows={2}
                                    placeholder="Descreva as adaptações necessárias"
                                />
                            </Grid>
                        )}
                        
                        {formData.acompanhamento_especial && (
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Detalhes do Acompanhamento"
                                    value={formData.detalhes_acompanhamento}
                                    onChange={handleFieldChange('detalhes_acompanhamento')}
                                    multiline
                                    rows={2}
                                    placeholder="Descreva o tipo de acompanhamento necessário"
                                />
                            </Grid>
                        )}
                    </Grid>
                </AccordionDetails>
            </Accordion>
            
            {/* Seção: Objetivos e Expectativas */}
            <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TrophyIcon color="primary" />
                        <Typography variant="h6">Objetivos e Expectativas</Typography>
                    </Box>
                </AccordionSummary>
                <AccordionDetails>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Objetivo do Curso"
                                value={formData.objetivo_curso}
                                onChange={handleFieldChange('objetivo_curso')}
                                multiline
                                rows={2}
                                placeholder="Por que deseja concluir os estudos?"
                            />
                        </Grid>
                        
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Expectativas"
                                value={formData.expectativas}
                                onChange={handleFieldChange('expectativas')}
                                multiline
                                rows={2}
                                placeholder="O que espera do curso e da escola?"
                            />
                        </Grid>
                        
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Áreas de Interesse"
                                value={formData.areas_interesse}
                                onChange={handleFieldChange('areas_interesse')}
                                multiline
                                rows={2}
                                placeholder="Quais matérias ou áreas mais interessam?"
                            />
                        </Grid>
                        
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Planos Pós-Conclusão"
                                value={formData.planos_pos_conclusao}
                                onChange={handleFieldChange('planos_pos_conclusao')}
                                multiline
                                rows={2}
                                placeholder="O que pretende fazer após concluir os estudos?"
                            />
                        </Grid>
                    </Grid>
                </AccordionDetails>
            </Accordion>
            
            {/* Informações de Ajuda */}
            <Box sx={{ mt: 2, p: 2, backgroundColor: 'success.light', borderRadius: 1 }}>
                <Typography variant="body2" color="success.dark">
                    <strong>📚 Importante:</strong> Essas informações ajudam a escola a 
                    entender melhor seu perfil e necessidades, permitindo um atendimento 
                    mais personalizado e eficaz.
                </Typography>
            </Box>
        </Box>
    );
};

export default AbaEscolaridade;

