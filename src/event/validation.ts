import * as Yup from 'yup';

export const getEventValidator = () => Yup.object().shape({
    name: Yup.string().required('Event name is required'),
    description: Yup.string().required('Description is required'),
    groupId: Yup.string().required('Group is required'),
    hostId: Yup.string().required('Host is required'),
    cost: Yup.number(),
    dates: Yup.array().of(Yup.string().required('Date(s) required')),
    repetition: Yup.number().required('Repetition is required'),
});

export const getUpdateEventValidator = () => Yup.object().shape({
    name: Yup.string(),
    description: Yup.string(),
    location: Yup.string(),
    cost: Yup.number(),
    date: Yup.string()
});

export const getUpdateSeriesValidator = () => Yup.object().shape({
    name: Yup.string(),
    description: Yup.string(),
    location: Yup.string(),
    cost: Yup.number()
});
