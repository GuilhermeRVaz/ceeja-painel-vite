// ARQUIVO: src/components/panels/PainelEdicao/AbaDadosPessoais.tsx
// DESCRIÇÃO: Aba de edição de dados pessoais do aluno

import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    TextField,
    FormControlLabel,
    Switch,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Grid,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Chip,
    useTheme,
    useMediaQuery
} from '@mui/material';
import {
    ExpandMore as ExpandMoreIcon,
    Person as PersonIcon,
    ContactMail as ContactIcon,
    Family as FamilyIcon,
    Work as WorkIcon
} from '@mui/icons-material';
import { useCockpitContext } from '../cockpit/CockpitLayout';

// =====================================================================
// INTERFACES
// =====================================================================
interface AbaDadosPessoaisProps {
    studentData: any;
}

interface FormData {
    // Identificação
    nome_completo: string;
    tem_nome_social: boolean;
    nome_social: string;
    tem_nome_afetivo: boolean;
    nome_afetivo: string;
    sexo: string;
    idade: string;
    data_nascimento: string;
    raca_cor: string;
    
    // Documentos
    rg: string;
    rg_digito: string;
    rg_uf: string;
    rg_data_emissao: string;
    cpf: string;
    
    // Filiação
    nome_mae: string;
    nome_pai: string;
    nacionalidade: string;
    nascimento_uf: string;
    nascimento_cidade: string;
    
    // Contato
    telefone: string;
    email: string;
    possui_internet: boolean;
    possui_device: boolean;
    
    // Informações Adicionais
    is_gemeo: boolean;
    nome_gemeo: string;
    trabalha: boolean;
    profissao: string;
    empresa: string;
    is_pcd: boolean;
    deficiencia: string;
}

// =====================================================================
// COMPONENTE PRINCIPAL
// =====================================================================
export const AbaDadosPessoais: React.FC<AbaDadosPessoaisProps> = ({ studentData }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const { saveData } = useCockpitContext();
    
    // Estado do formulário
    const [formData, setFormData] = useState<FormData>({
        // Valores padrão
        nome_completo: '',
        tem_nome_social: false,
        nome_social: '',
        tem_nome_afetivo: false,
        nome_afetivo: '',
        sexo: '',
        idade: '',
        data_nascimento: '',
        raca_cor: '',
        rg: '',
        rg_digito: '',
        rg_uf: '',
        rg_data_emissao: '',
        cpf: '',
        nome_mae: '',
        nome_pai: '',
        nacionalidade: 'Brasileira',
        nascimento_uf: '',
        nascimento_cidade: '',
        telefone: '',
        email: '',
        possui_internet: false,
        possui_device: false,
        is_gemeo: false,
        nome_gemeo: '',
        trabalha: false,
        profissao: '',
        empresa: '',
        is_pcd: false,
        deficiencia: ''
    });
    
    // Carregar dados do estudante no formulário
    useEffect(() => {
        if (studentData) {
            setFormData(prev => ({
                ...prev,
                ...studentData
            }));
        }
    }, [studentData]);
    
    // Handler para mudanças nos campos
    const handleFieldChange = (field: keyof FormData) => (
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
            {/* Seção: Identificação */}
            <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PersonIcon color="primary" />
                        <Typography variant="h6">Identificação</Typography>
                        <Chip label="Obrigatório" size="small" color="error" />
                    </Box>
                </AccordionSummary>
                <AccordionDetails>
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={8}>
                            <TextField
                                fullWidth
                                label="Nome Completo"
                                value={formData.nome_completo}
                                onChange={handleFieldChange('nome_completo')}
                                required
                                helperText="Digite o nome completo sem abreviações"
                            />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <TextField
                                fullWidth
                                label="Idade"
                                type="number"
                                value={formData.idade}
                                onChange={handleFieldChange('idade')}
                                inputProps={{ min: 0, max: 120 }}
                            />
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={formData.tem_nome_social}
                                        onChange={handleFieldChange('tem_nome_social')}
                                    />
                                }
                                label="Possui Nome Social"
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Nome Social"
                                value={formData.nome_social}
                                onChange={handleFieldChange('nome_social')}
                                disabled={!formData.tem_nome_social}
                            />
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={formData.tem_nome_afetivo}
                                        onChange={handleFieldChange('tem_nome_afetivo')}
                                    />
                                }
                                label="Possui Nome Afetivo"
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Nome Afetivo"
                                value={formData.nome_afetivo}
                                onChange={handleFieldChange('nome_afetivo')}
                                disabled={!formData.tem_nome_afetivo}
                            />
                        </Grid>
                        
                        <Grid item xs={12} md={4}>
                            <FormControl fullWidth>
                                <InputLabel>Sexo</InputLabel>
                                <Select
                                    value={formData.sexo}
                                    onChange={handleFieldChange('sexo')}
                                    label="Sexo"
                                >
                                    <MenuItem value="Masculino">Masculino</MenuItem>
                                    <MenuItem value="Feminino">Feminino</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <TextField
                                fullWidth
                                label="Data de Nascimento"
                                type="date"
                                value={formData.data_nascimento}
                                onChange={handleFieldChange('data_nascimento')}
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <TextField
                                fullWidth
                                label="Raça/Cor"
                                value={formData.raca_cor}
                                onChange={handleFieldChange('raca_cor')}
                            />
                        </Grid>
                    </Grid>
                </AccordionDetails>
            </Accordion>
            
            {/* Seção: Documentos */}
            <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ContactIcon color="primary" />
                        <Typography variant="h6">Documentos</Typography>
                        <Chip label="Obrigatório" size="small" color="error" />
                    </Box>
                </AccordionSummary>
                <AccordionDetails>
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={4}>
                            <TextField
                                fullWidth
                                label="RG"
                                value={formData.rg}
                                onChange={handleFieldChange('rg')}
                                required
                            />
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <TextField
                                fullWidth
                                label="Dígito"
                                value={formData.rg_digito}
                                onChange={handleFieldChange('rg_digito')}
                                inputProps={{ maxLength: 1 }}
                            />
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <TextField
                                fullWidth
                                label="UF"
                                value={formData.rg_uf}
                                onChange={handleFieldChange('rg_uf')}
                                inputProps={{ maxLength: 2 }}
                            />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <TextField
                                fullWidth
                                label="Data de Emissão"
                                type="date"
                                value={formData.rg_data_emissao}
                                onChange={handleFieldChange('rg_data_emissao')}
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="CPF"
                                value={formData.cpf}
                                onChange={handleFieldChange('cpf')}
                                required
                                inputProps={{ maxLength: 14 }}
                                helperText="Formato: 000.000.000-00"
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Telefone"
                                value={formData.telefone}
                                onChange={handleFieldChange('telefone')}
                                helperText="Formato: (11) 99999-9999"
                            />
                        </Grid>
                        
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="E-mail"
                                type="email"
                                value={formData.email}
                                onChange={handleFieldChange('email')}
                            />
                        </Grid>
                    </Grid>
                </AccordionDetails>
            </Accordion>
            
            {/* Seção: Filiação e Origem */}
            <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <FamilyIcon color="primary" />
                        <Typography variant="h6">Filiação e Origem</Typography>
                    </Box>
                </AccordionSummary>
                <AccordionDetails>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Nome da Mãe"
                                value={formData.nome_mae}
                                onChange={handleFieldChange('nome_mae')}
                                required
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Nome do Pai"
                                value={formData.nome_pai}
                                onChange={handleFieldChange('nome_pai')}
                            />
                        </Grid>
                        
                        <Grid item xs={12} md={4}>
                            <TextField
                                fullWidth
                                label="Nacionalidade"
                                value={formData.nacionalidade}
                                onChange={handleFieldChange('nacionalidade')}
                            />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <TextField
                                fullWidth
                                label="UF de Nascimento"
                                value={formData.nascimento_uf}
                                onChange={handleFieldChange('nascimento_uf')}
                                inputProps={{ maxLength: 2 }}
                            />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <TextField
                                fullWidth
                                label="Cidade de Nascimento"
                                value={formData.nascimento_cidade}
                                onChange={handleFieldChange('nascimento_cidade')}
                            />
                        </Grid>
                    </Grid>
                </AccordionDetails>
            </Accordion>
            
            {/* Seção: Tecnologia e Acessibilidade */}
            <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <WorkIcon color="primary" />
                        <Typography variant="h6">Informações Adicionais</Typography>
                    </Box>
                </AccordionSummary>
                <AccordionDetails>
                    <Grid container spacing={2}>
                        {/* Tecnologia */}
                        <Grid item xs={12}>
                            <Typography variant="subtitle2" gutterBottom>
                                Acesso à Tecnologia
                            </Typography>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={formData.possui_internet}
                                        onChange={handleFieldChange('possui_internet')}
                                    />
                                }
                                label="Possui acesso à internet"
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={formData.possui_device}
                                        onChange={handleFieldChange('possui_device')}
                                    />
                                }
                                label="Possui dispositivo (celular/computador)"
                            />
                        </Grid>
                        
                        {/* Trabalho */}
                        <Grid item xs={12}>
                            <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                                Informações Profissionais
                            </Typography>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={formData.trabalha}
                                        onChange={handleFieldChange('trabalha')}
                                    />
                                }
                                label="Trabalha atualmente"
                            />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <TextField
                                fullWidth
                                label="Profissão"
                                value={formData.profissao}
                                onChange={handleFieldChange('profissao')}
                                disabled={!formData.trabalha}
                            />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <TextField
                                fullWidth
                                label="Empresa"
                                value={formData.empresa}
                                onChange={handleFieldChange('empresa')}
                                disabled={!formData.trabalha}
                            />
                        </Grid>
                        
                        {/* Outras informações */}
                        <Grid item xs={12}>
                            <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                                Outras Informações
                            </Typography>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={formData.is_gemeo}
                                        onChange={handleFieldChange('is_gemeo')}
                                    />
                                }
                                label="É gêmeo"
                            />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <TextField
                                fullWidth
                                label="Nome do Gêmeo"
                                value={formData.nome_gemeo}
                                onChange={handleFieldChange('nome_gemeo')}
                                disabled={!formData.is_gemeo}
                            />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={formData.is_pcd}
                                        onChange={handleFieldChange('is_pcd')}
                                    />
                                }
                                label="Pessoa com Deficiência"
                            />
                        </Grid>
                        
                        {formData.is_pcd && (
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Tipo de Deficiência"
                                    value={formData.deficiencia}
                                    onChange={handleFieldChange('deficiencia')}
                                    multiline
                                    rows={2}
                                    helperText="Descreva o tipo de deficiência para adequações necessárias"
                                />
                            </Grid>
                        )}
                    </Grid>
                </AccordionDetails>
            </Accordion>
        </Box>
    );
};

export default AbaDadosPessoais;

