// ARQUIVO: src/App.tsx - VERSÃO CORRIGIDA PARA VITE

import React from 'react';
import { Admin, Resource } from 'react-admin';
import { supabaseDataProvider } from 'ra-supabase';
import { supabase } from './supabase/supabaseClient';
import { AlunoList, AlunoEdit } from './resources/alunos';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Card, CardContent, CardHeader } from '@mui/material';

// --- Dashboard Provisório ---
const Dashboard = () => (
    <Card>
        <CardHeader title="Bem-vindo ao SisGOE" />
        <CardContent>
            Painel de Verificação de Matrículas - Cockpit Administrativo
        </CardContent>
    </Card>
);

// --- Crie uma instância do cliente ---
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 3,
            retryDelay: 1000,
            staleTime: 5 * 60 * 1000, // 5 minutos
        },
    },
});

// --- Configure o dataProvider com logs de debug ---
const dataProvider = supabaseDataProvider({
    instanceUrl: import.meta.env.VITE_SUPABASE_URL!,
    apiKey: import.meta.env.VITE_SUPABASE_ANON_KEY!,
    supabaseClient: supabase
});

// Wrapper para adicionar logs de debug ao dataProvider
const debugDataProvider = {
    ...dataProvider,
    getList: async (resource: string, params: any) => {
        console.log(`🔍 DataProvider.getList - Resource: ${resource}`, params);
        try {
            const result = await dataProvider.getList(resource, params);
            console.log(`✅ DataProvider.getList - Success:`, {
                resource,
                total: result.total,
                dataLength: result.data.length
            });
            return result;
        } catch (error) {
            console.error(`❌ DataProvider.getList - Error:`, { resource, error });
            throw error;
        }
    },
    getOne: async (resource: string, params: any) => {
        console.log(`🔍 DataProvider.getOne - Resource: ${resource}`, params);
        try {
            const result = await dataProvider.getOne(resource, params);
            console.log(`✅ DataProvider.getOne - Success:`, { resource, id: params.id });
            return result;
        } catch (error) {
            console.error(`❌ DataProvider.getOne - Error:`, { resource, error });
            throw error;
        }
    },
    update: async (resource: string, params: any) => {
        console.log(`🔍 DataProvider.update - Resource: ${resource}`, params);
        try {
            const result = await dataProvider.update(resource, params);
            console.log(`✅ DataProvider.update - Success:`, { resource, id: params.id });
            return result;
        } catch (error) {
            console.error(`❌ DataProvider.update - Error:`, { resource, error });
            throw error;
        }
    },
    create: async (resource: string, params: any) => {
        console.log(`🔍 DataProvider.create - Resource: ${resource}`, params);
        try {
            const result = await dataProvider.create(resource, params);
            console.log(`✅ DataProvider.create - Success:`, { resource });
            return result;
        } catch (error) {
            console.error(`❌ DataProvider.create - Error:`, { resource, error });
            throw error;
        }
    }
};

const App = () => {
    // Verificar se as variáveis de ambiente estão definidas
    React.useEffect(() => {
        console.log('🔧 Verificando configuração do ambiente...');
        console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL ? '✅ Definida' : '❌ Não definida');
        console.log('VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ Definida' : '❌ Não definida');
        
        if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
            console.error('❌ Variáveis de ambiente do Supabase não estão definidas!');
            console.log('📝 Certifique-se de que o arquivo .env contém:');
            console.log('VITE_SUPABASE_URL=https://seu-projeto.supabase.co');
            console.log('VITE_SUPABASE_ANON_KEY=sua_chave_anonima');
        }
    }, []);

    return (
        <QueryClientProvider client={queryClient}>
            <Admin 
                dataProvider={debugDataProvider} 
                dashboard={Dashboard}
                title="SisGOE - Cockpit de Verificação"
            >
                <Resource 
                    name="personal_data"
                    list={AlunoList}
                    edit={AlunoEdit}
                    options={{ label: 'Alunos' }}
                />
                <Resource name="addresses" />
                <Resource name="schooling_data" />
                <Resource name="enrollments" />
                <Resource name="document_extractions" />
            </Admin>
        </QueryClientProvider>
    );
};

export default App;
