import { Layout } from 'react-admin';
import MyAppBar from './MyAppBar';

const MyLayout = (props: any) => <Layout appBar={MyAppBar} {...props} />;

export default MyLayout; 