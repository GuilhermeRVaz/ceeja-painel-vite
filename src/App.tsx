// ARQUIVO: src/App.tsx

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
            Painel de Verificação de Matrículas.
        </CardContent>
    </Card>
);

// --- Crie uma instância do cliente ---
const queryClient = new QueryClient();

// --- Configure o dataProvider ---
const dataProvider = supabaseDataProvider({
    instanceUrl: import.meta.env.VITE_SUPABASE_URL!,
    apiKey: import.meta.env.VITE_SUPABASE_ANON_KEY!,
    supabaseClient: supabase
});

const App = () => (
    <QueryClientProvider client={queryClient}>
        <Admin dataProvider={dataProvider} dashboard={Dashboard}>
            <Resource 
                name="personal_data"
                list={AlunoList}
                edit={AlunoEdit}
                options={{ label: 'Alunos' }}
            />
        </Admin>
    </QueryClientProvider>
);

export default App;