import { Request, Response } from 'express';
import { getGroupValidator } from "./validation";
import {Group, mapDbGroupToGroup, mapGroupToDbGroup} from "./Group";
import {
    deleteGroup, deleteGroupUser,
    postGroup,
    postUserInvite,
    putGroup,
    putUserInvite,
    putUserRequest,
    updateOwner
} from "./repository";
import {User} from "../auth/User";
import {getUserValidator} from "../auth/validation";
import {putUser} from "../auth/repository";
import {GroupUser} from "../common/constants/GroupUser";

export const createGroup = async (req: Request, res: Response) => {
    try {
        const group = req.body as Group;
        const userId = res.locals.userId;

        try {
            const validator = getGroupValidator();

            await validator.validate(group);
        } catch (error) {
            return res.status(400).json({ error: 'Invalid input', details: error });
        }

        const [response] = await postGroup(mapGroupToDbGroup(group), userId);

        res.status(201).json({
            success: true,
            response: mapDbGroupToGroup(response)
        });
    } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
    }
}

export const updateGroup = async (req: Request, res: Response) => {
    try {
        const group = req.body as Group;

        try {
            const validator = getGroupValidator();

            await validator.validate(group);
        } catch (error) {
            return res.status(400).json({ error: 'Invalid input', details: error });
        }

        const response = await putGroup(group);

        res.status(201).json({
            success: true,
            response
        });
    } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
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
        res.status(500).json({ success: false, error: err.message });
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
        res.status(500).json({ success: false, error: err.message });
    }
}

export const inviteUser = async (req: Request, res: Response) => {
    try {
        const { userId, id } = req.query;

        await postUserInvite(Number(userId), Number(id), true);

        res.status(204).json({
            success: true,
        });
    } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
    }
}

export const respondToInvite = async (req: Request, res: Response) => {
    try {
        const { id, accepted } = req.query;
        const userId = res.locals.userId;

        await putUserInvite(Number(id), userId, accepted === "true");

        res.status(204).json({
            success: true,
        });
    } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
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
        res.status(500).json({ success: false, error: err.message });
    }
}

export const respondToRequest = async (req: Request, res: Response) => {
    try {
        const { id: groupId, userId, accepted } = req.query;

        await putUserRequest(Number(groupId), Number(userId), accepted === "true");

        res.status(204).json({
            success: true,
        });
    } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
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
        res.status(500).json({ success: false, error: err.message });
    }
}
