import {Request, Response} from 'express';
import {getGroupValidator} from "./validation";
import {Group, mapDbGroupToGroup, mapGroupToDbGroup} from "./Group";
import {
    deleteGroup, deleteGroupUser, getGroupUserBy,
    postGroup,
    postUserInvite,
    putGroup,
    putUserInvite,
    putUserRequest, putUserRole, selectGroup,
    updateOwner
} from "./repository";
import {GroupUser} from "../common/constants/GroupUser";
import {Role} from "../common/enums/role";

export const getGroup = async (req: Request, res: Response) => {
    try {
        const groupId = Number(req.query.id);
        const userId = Number(res.locals.userId);

        const [user] = await getGroupUserBy(groupId, userId);

        const response = await selectGroup(groupId, Boolean(user), [Role.admin, Role.owner].includes(user?.role));

        if(!response) {
            res.status(404).json({
                success: false,
                message: `Group ID ${groupId} not found`
            })
        }

        res.status(200).json({
            success: true,
            response: mapDbGroupToGroup(response)
        })
    } catch (err: any) {
        res.status(500).json({success: false, error: err.message});
    }
}

export const createGroup = async (req: Request, res: Response) => {
    try {
        const group = req.body as Group;
        const userId = res.locals.userId;

        try {
            const validator = getGroupValidator();

            await validator.validate(group);
        } catch (error) {
            return res.status(400).json({error: 'Invalid input', details: error});
        }

        const [response] = await postGroup(mapGroupToDbGroup(group), userId);

        res.status(201).json({
            success: true,
            response
        });
    } catch (err: any) {
        res.status(500).json({success: false, error: err.message});
    }
}

export const updateGroup = async (req: Request, res: Response) => {
    try {
        const group = req.body as Group;

        try {
            const validator = getGroupValidator();

            await validator.validate(group);
        } catch (error) {
            return res.status(400).json({error: 'Invalid input', details: error});
        }

        const response = await putGroup(group);

        res.status(201).json({
            success: true,
            response
        });
    } catch (err: any) {
        res.status(500).json({success: false, error: err.message});
    }
}

export const removeGroup = async (req: Request, res: Response) => {
    try {
        const groupId = Number(req.query.id);

        await deleteGroup(groupId);

        res.status(204).json({
            success: true
        });
    } catch (err: any) {
        res.status(500).json({success: false, error: err.message});
    }
}

export const changeOwner = async (req: Request, res: Response) => {
    try {
        const groupUser = req.body as GroupUser;
        const userId = res.locals.userId;

        await updateOwner(groupUser, userId);

        res.status(204).json({
            success: true,
        });
    } catch (err: any) {
        res.status(500).json({success: false, error: err.message});
    }
}

export const inviteUser = async (req: Request, res: Response) => {
    try {
        const {userId, id} = req.query;

        await postUserInvite(Number(userId), Number(id), true);

        res.status(204).json({
            success: true,
        });
    } catch (err: any) {
        res.status(500).json({success: false, error: err.message});
    }
}

export const respondToInvite = async (req: Request, res: Response) => {
    try {
        const {id, accepted} = req.query;
        const userId = res.locals.userId;

        await putUserInvite(Number(id), userId, accepted === "true");

        res.status(204).json({
            success: true,
        });
    } catch (err: any) {
        res.status(500).json({success: false, error: err.message});
    }
}

export const requestToJoin = async (req: Request, res: Response) => {
    try {
        const groupId = Number(req.query.id);
        const userId = Number(res.locals.userId);

        await postUserInvite(userId, groupId, false);

        res.status(204).json({
            success: true,
        });
    } catch (err: any) {
        res.status(500).json({success: false, error: err.message});
    }
}

export const respondToRequest = async (req: Request, res: Response) => {
    try {
        const {id: groupId, userId, accepted} = req.query;

        await putUserRequest(Number(groupId), Number(userId), accepted === "true");

        res.status(204).json({
            success: true,
        });
    } catch (err: any) {
        res.status(500).json({success: false, error: err.message});
    }
}

export const removeMember = async (req: Request, res: Response) => {
    try {
        const groupId = res.locals.groupId;
        const userId = Number(req.query.userId);

        await deleteGroupUser(groupId, userId);

        res.status(204).json({
            success: true,
        });
    } catch (err: any) {
        res.status(500).json({success: false, error: err.message});
    }
}

export const leaveGroup = async (_: Request, res: Response) => {
    try {
        const {groupId, userId} = res.locals;

        await deleteGroupUser(groupId, userId);

        res.status(204).json({
            success: true,
        });
    } catch (err: any) {
        res.status(500).json({success: false, error: err.message});
    }
}

export const changeRole = async (req: Request, res: Response) => {
    try {
        const {groupId} = res.locals;
        const {role, userId} = req.query;

        if (isNaN(Number(role))) {
            res.status(400).json({
                success: false,
                message: "New role not provided"
            })
        }

        await putUserRole(groupId, Number(userId), Number(role));

        res.status(204).json({
            success: true
        });
    } catch (err: any) {
        res.status(500).json({success: false, error: err.message});
    }
}
