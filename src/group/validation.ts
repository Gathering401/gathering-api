import * as Yup from 'yup';

export const getGroupValidator = () => Yup.object().shape({
    name: Yup.string().required('Group name is required'),
    description: Yup.string().required('Description is required'),
    public: Yup.boolean().required()
});
