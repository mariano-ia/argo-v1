import { Routes, Route } from 'react-router-dom';
import { Landing }         from './pages/Landing';
import { Login }           from './pages/Login';
import { Dashboard }       from './pages/Dashboard';
import { Sessions }        from './pages/dashboard/Sessions';
import { Metrics }         from './pages/dashboard/Metrics';
import { QuestionsAdmin }  from './pages/dashboard/QuestionsAdmin';
import { ProtectedRoute }  from './components/ProtectedRoute';
import { OnboardingFlow }  from './components/onboarding/OnboardingFlow';

function App() {
    return (
        <Routes>
            {/* Public */}
            <Route path="/"    element={<Landing />} />
            <Route path="/app" element={<OnboardingFlow />} />
            <Route path="/login" element={<Login />} />

            {/* Protected dashboard */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>}>
                <Route index element={<Sessions />} />
                <Route path="sessions"  element={<Sessions />} />
                <Route path="metrics"   element={<Metrics />} />
                <Route path="questions" element={<QuestionsAdmin />} />
            </Route>
        </Routes>
    );
}

export default App;
