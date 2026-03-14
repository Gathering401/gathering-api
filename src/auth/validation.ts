import * as Yup from 'yup';

export const getUserValidator = () => Yup.object().shape({
    id: Yup.number(),
    firstName: Yup.string().required('First name is required'),
    lastName: Yup.string().required('Last name is required'),
    email: Yup.string().email('Email is required'),
    password: Yup.string().required('Password is required'),
    username: Yup.string().required('Username is required'),
    birthdate: Yup.string().required('Birthdate is required'),
});
