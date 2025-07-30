// ARQUIVO: src/components/panels/PainelEdicao/AbaEndereco.tsx
// DESCRIÇÃO: Aba de edição de dados de endereço do aluno

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
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    useTheme,
    useMediaQuery
} from '@mui/material';
import {
    ExpandMore as ExpandMoreIcon,
    Home as HomeIcon,
    LocationOn as LocationIcon,
    Search as SearchIcon
} from '@mui/icons-material';
import { useCockpitContext } from '../cockpit/CockpitLayout';

// =====================================================================
// INTERFACES
// =====================================================================
interface AbaEnderecoProps {
    addressData: any;
}

interface EnderecoFormData {
    // Endereço Principal
    cep: string;
    logradouro: string;
    numero: string;
    complemento: string;
    bairro: string;
    cidade: string;
    uf: string;
    
    // Detalhes do Endereço
    tipo_logradouro: string;
    zona: string;
    ponto_referencia: string;
    
    // Informações Adicionais
    tempo_residencia: string;
    tipo_residencia: string;
    situacao_residencia: string;
    
    // Contato
    telefone_residencial: string;
    telefone_comercial: string;
}

// =====================================================================
// DADOS AUXILIARES
// =====================================================================
const ESTADOS_BRASIL = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

const TIPOS_LOGRADOURO = [
    'Rua', 'Avenida', 'Travessa', 'Alameda', 'Praça', 'Estrada',
    'Rodovia', 'Viela', 'Beco', 'Largo', 'Quadra', 'Outro'
];

const TIPOS_RESIDENCIA = [
    'Casa', 'Apartamento', 'Kitnet', 'Sobrado', 'Chácara',
    'Sítio', 'Fazenda', 'Outro'
];

const SITUACAO_RESIDENCIA = [
    'Própria', 'Alugada', 'Cedida', 'Financiada', 'Outro'
];

// =====================================================================
// COMPONENTE PRINCIPAL
// =====================================================================
export const AbaEndereco: React.FC<AbaEnderecoProps> = ({ addressData }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const { saveData } = useCockpitContext();
    
    // Estado do formulário
    const [formData, setFormData] = useState<EnderecoFormData>({
        // Valores padrão
        cep: '',
        logradouro: '',
        numero: '',
        complemento: '',
        bairro: '',
        cidade: '',
        uf: 'SP',
        tipo_logradouro: 'Rua',
        zona: '',
        ponto_referencia: '',
        tempo_residencia: '',
        tipo_residencia: 'Casa',
        situacao_residencia: 'Própria',
        telefone_residencial: '',
        telefone_comercial: ''
    });
    
    const [cepLoading, setCepLoading] = useState(false);
    
    // Carregar dados do endereço no formulário
    useEffect(() => {
        if (addressData) {
            setFormData(prev => ({
                ...prev,
                ...addressData
            }));
        }
    }, [addressData]);
    
    // Handler para mudanças nos campos
    const handleFieldChange = (field: keyof EnderecoFormData) => (
        event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | any
    ) => {
        const value = event.target.value;
        
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
        
        // Auto-save após 2 segundos de inatividade
        // TODO: Implementar debounce para auto-save
    };
    
    // Buscar endereço por CEP
    const buscarCEP = async () => {
        if (!formData.cep || formData.cep.length < 8) {
            return;
        }
        
        setCepLoading(true);
        
        try {
            const cepLimpo = formData.cep.replace(/\D/g, '');
            const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
            const data = await response.json();
            
            if (!data.erro) {
                setFormData(prev => ({
                    ...prev,
                    logradouro: data.logradouro || prev.logradouro,
                    bairro: data.bairro || prev.bairro,
                    cidade: data.localidade || prev.cidade,
                    uf: data.uf || prev.uf
                }));
            }
        } catch (error) {
            console.error('Erro ao buscar CEP:', error);
        } finally {
            setCepLoading(false);
        }
    };
    
    // Formatar CEP
    const formatarCEP = (value: string) => {
        const cep = value.replace(/\D/g, '');
        return cep.replace(/(\d{5})(\d{3})/, '$1-$2');
    };
    
    // Handler específico para CEP
    const handleCEPChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = formatarCEP(event.target.value);
        setFormData(prev => ({
            ...prev,
            cep: value
        }));
    };
    
    return (
        <Box sx={{ p: 2 }}>
            {/* Seção: Endereço Principal */}
            <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <HomeIcon color="primary" />
                        <Typography variant="h6">Endereço Residencial</Typography>
                        <Chip label="Obrigatório" size="small" color="error" />
                    </Box>
                </AccordionSummary>
                <AccordionDetails>
                    <Grid container spacing={2}>
                        {/* CEP com busca automática */}
                        <Grid item xs={12} md={4}>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <TextField
                                    fullWidth
                                    label="CEP"
                                    value={formData.cep}
                                    onChange={handleCEPChange}
                                    required
                                    inputProps={{ maxLength: 9 }}
                                    helperText="Formato: 00000-000"
                                />
                                <Button
                                    variant="outlined"
                                    onClick={buscarCEP}
                                    disabled={cepLoading || formData.cep.length < 9}
                                    sx={{ minWidth: 'auto', px: 2 }}
                                >
                                    <SearchIcon />
                                </Button>
                            </Box>
                        </Grid>
                        
                        <Grid item xs={12} md={4}>
                            <FormControl fullWidth>
                                <InputLabel>Tipo de Logradouro</InputLabel>
                                <Select
                                    value={formData.tipo_logradouro}
                                    onChange={handleFieldChange('tipo_logradouro')}
                                    label="Tipo de Logradouro"
                                >
                                    {TIPOS_LOGRADOURO.map(tipo => (
                                        <MenuItem key={tipo} value={tipo}>
                                            {tipo}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        
                        <Grid item xs={12} md={4}>
                            <TextField
                                fullWidth
                                label="Zona"
                                value={formData.zona}
                                onChange={handleFieldChange('zona')}
                                placeholder="Ex: Norte, Sul, Centro"
                            />
                        </Grid>
                        
                        {/* Logradouro e número */}
                        <Grid item xs={12} md={8}>
                            <TextField
                                fullWidth
                                label="Logradouro"
                                value={formData.logradouro}
                                onChange={handleFieldChange('logradouro')}
                                required
                                helperText="Nome da rua, avenida, etc."
                            />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <TextField
                                fullWidth
                                label="Número"
                                value={formData.numero}
                                onChange={handleFieldChange('numero')}
                                required
                                placeholder="Ex: 123, S/N"
                            />
                        </Grid>
                        
                        {/* Complemento e bairro */}
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Complemento"
                                value={formData.complemento}
                                onChange={handleFieldChange('complemento')}
                                placeholder="Ex: Apto 45, Bloco B"
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Bairro"
                                value={formData.bairro}
                                onChange={handleFieldChange('bairro')}
                                required
                            />
                        </Grid>
                        
                        {/* Cidade e UF */}
                        <Grid item xs={12} md={8}>
                            <TextField
                                fullWidth
                                label="Cidade"
                                value={formData.cidade}
                                onChange={handleFieldChange('cidade')}
                                required
                            />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <FormControl fullWidth required>
                                <InputLabel>UF</InputLabel>
                                <Select
                                    value={formData.uf}
                                    onChange={handleFieldChange('uf')}
                                    label="UF"
                                >
                                    {ESTADOS_BRASIL.map(estado => (
                                        <MenuItem key={estado} value={estado}>
                                            {estado}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        
                        {/* Ponto de referência */}
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Ponto de Referência"
                                value={formData.ponto_referencia}
                                onChange={handleFieldChange('ponto_referencia')}
                                multiline
                                rows={2}
                                placeholder="Ex: Próximo ao mercado, em frente à escola"
                            />
                        </Grid>
                    </Grid>
                </AccordionDetails>
            </Accordion>
            
            {/* Seção: Informações da Residência */}
            <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LocationIcon color="primary" />
                        <Typography variant="h6">Informações da Residência</Typography>
                    </Box>
                </AccordionSummary>
                <AccordionDetails>
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={4}>
                            <FormControl fullWidth>
                                <InputLabel>Tipo de Residência</InputLabel>
                                <Select
                                    value={formData.tipo_residencia}
                                    onChange={handleFieldChange('tipo_residencia')}
                                    label="Tipo de Residência"
                                >
                                    {TIPOS_RESIDENCIA.map(tipo => (
                                        <MenuItem key={tipo} value={tipo}>
                                            {tipo}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        
                        <Grid item xs={12} md={4}>
                            <FormControl fullWidth>
                                <InputLabel>Situação da Residência</InputLabel>
                                <Select
                                    value={formData.situacao_residencia}
                                    onChange={handleFieldChange('situacao_residencia')}
                                    label="Situação da Residência"
                                >
                                    {SITUACAO_RESIDENCIA.map(situacao => (
                                        <MenuItem key={situacao} value={situacao}>
                                            {situacao}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        
                        <Grid item xs={12} md={4}>
                            <TextField
                                fullWidth
                                label="Tempo de Residência"
                                value={formData.tempo_residencia}
                                onChange={handleFieldChange('tempo_residencia')}
                                placeholder="Ex: 2 anos, 6 meses"
                            />
                        </Grid>
                        
                        {/* Telefones */}
                        <Grid item xs={12}>
                            <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                                Telefones de Contato
                            </Typography>
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Telefone Residencial"
                                value={formData.telefone_residencial}
                                onChange={handleFieldChange('telefone_residencial')}
                                placeholder="(11) 3333-4444"
                                helperText="Telefone fixo da residência"
                            />
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Telefone Comercial"
                                value={formData.telefone_comercial}
                                onChange={handleFieldChange('telefone_comercial')}
                                placeholder="(11) 3333-4444"
                                helperText="Telefone do trabalho"
                            />
                        </Grid>
                    </Grid>
                </AccordionDetails>
            </Accordion>
            
            {/* Informações de Ajuda */}
            <Box sx={{ mt: 2, p: 2, backgroundColor: 'info.light', borderRadius: 1 }}>
                <Typography variant="body2" color="info.dark">
                    <strong>💡 Dica:</strong> Preencha o CEP e clique no botão de busca para 
                    preencher automaticamente o endereço. Verifique se as informações estão 
                    corretas e complete os campos restantes.
                </Typography>
            </Box>
        </Box>
    );
};

export default AbaEndereco;

