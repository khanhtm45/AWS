import { useNavigate } from 'react-router-dom';

export const useNavigation = () => {
    const navigate = useNavigate();

    const goToHome = () => navigate('/');
    const goToLogin = () => navigate('/login');
    const goToSignUp = () => navigate('/signup');
    const goToProfile = () => navigate('/personal-info');
    const goToBooking = () => navigate('/booking');
    const goToManager = () => navigate('/manager');
    const goToDonor = () => navigate('/donor');
    const goToHospital = () => navigate('/hospital');
    const goToHistory = () => navigate('/booking-history');
    const goToBookingCreate = () => navigate('/booking-create');
    const goToContact = () => navigate('/contact');

    return {
        goToHome,
        goToLogin,
        goToSignUp,
        goToProfile,
        goToBooking,
        goToManager,
        goToDonor,
        goToHospital,
        goToHistory,
        goToBookingCreate,
        goToContact
    };
}; 