import { Admin, Resource } from 'react-admin';
import { supabaseDataProvider } from 'ra-supabase';
import { supabase } from './supabase/supabaseClient';
import { AlunoList, AlunoEdit } from './resources/alunos';

// Jeito novo (Vite)
const dataProvider = supabaseDataProvider({
    instanceUrl: import.meta.env.VITE_SUPABASE_URL!,
    apiKey: import.meta.env.VITE_SUPABASE_ANON_KEY!,
    supabaseClient: supabase
});

const App = () => (
    <Admin dataProvider={dataProvider}>
        <Resource 
            name="personal_data"
            list={AlunoList}
            edit={AlunoEdit}
            options={{ label: 'Alunos' }}
        />
    </Admin>
);

export default App;