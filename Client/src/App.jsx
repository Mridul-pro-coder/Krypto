import NavBar from './components/NavBar';
import React from 'react';
import Welcome from './components/Welcome';
import Services from './components/Services';
import Transactions from './components/Transactions';
import Footer from './components/Footer';


const App = () => {
    return (
        <div className="min-h-screen ">
            <div className='gradient-bg-welcome'>
                <NavBar />
                <Welcome />
            </div>
            <Services />
            <Transactions />
            <Footer />
            
        </div>
    )
}
export default App;