import {Request, Response} from 'express';
import {getGroupValidator} from "./validation";
import {Group, mapDbGroupToGroup, mapGroupToDbGroup} from "./types";
import {
    deleteGroup, deleteGroupUser, getGroupUserBy, selectUserGroups, getUsersBy,
    postGroup,
    postUserInvite,
    putGroup,
    putUserInvite,
    putUserRole, selectAvailableGroups, selectGroup,
    updateOwner, updateGroupNotificationPreference, selectAllGroupEvents, selectEventCreatableGroups
} from "./repository";
import {Role} from "../common/enums/role";

export const getGroup = async (req: Request, res: Response) => {
    try {
        const groupId = Number(req.query.id);
        const userId = Number(res.locals.userId);

        const [user] = await getGroupUserBy(groupId, userId);

        const response = await selectGroup(groupId, [Role.admin, Role.owner].includes(user!.role), userId);

        if(!response) {
            res.status(404).json({
                success: false,
                message: `Group ID ${groupId} not found`
            })
        }

        res.status(200).json({
            success: true,
            response: mapDbGroupToGroup(response),
            currentRole: user.role,
            allowNotifications: user.allow_notifications
        })
    } catch (err: any) {
        res.status(500).json({success: false, error: err.message});
    }
}

export const getAllGroupEvents = async (_: Request, res: Response) => {
    try {
        const rows = await selectAllGroupEvents(res.locals.groupId, res.locals.userId);

        const events = rows.map((row: any) => ({
            id: row.event_id,
            name: row.event_name,
            description: row.event_description,
            date: row.date,
            repetition: row.repetition,
            seriesId: row.series_id,
            myRsvp: row.my_rsvp
        }));

        res.status(200).json({success: true, response: events});
    } catch (err: any) {
        res.status(500).json({success: false, error: err.message});
    }
}

export const getMyGroups = async (_: Request, res: Response) => {
    try {
        const userId = Number(res.locals.userId);

        const response = await selectUserGroups(userId);

        res.status(200).json({
            success: true,
            response
        });
    } catch (err: any) {
        res.status(500).json({success: false, error: err.message});
    }
}

export const getEventCreatableGroups = async (_: Request, res: Response) => {
    try {
        const userId = res.locals.userId;

        const groups = await selectEventCreatableGroups(userId);

        return res.json({
            success: true,
            response: groups
        });
    } catch (err: any) {
        return res.status(500).json({ success: false, error: err.message });
    }
}

export const getAvailableGroups = async (req: Request, res: Response) => {
    try {
        const searchString = req.query.searchString as string | undefined;
        const userId = Number(res.locals.userId);

        const response = await selectAvailableGroups(searchString, userId);

        res.status(200).json({ success: true, response });
    } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
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
        const { groupId, userId } = res.locals;
        const { userId: newOwnerId } = req.query;

        await updateOwner(groupId, Number(newOwnerId), Number(userId));

        res.status(204).json({
            success: true
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

        await putUserInvite(Number(id), userId, accepted === "true", true);

        res.status(200).json({
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

        res.status(200).json({
            success: true
        });
    } catch (err: any) {
        res.status(500).json({success: false, error: err.message});
    }
}

export const respondToRequest = async (req: Request, res: Response) => {
    try {
        const { id, userId, accepted } = req.query;

        await putUserInvite(Number(id), Number(userId), accepted === "true", false);

        res.status(200).json({
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

export const searchUsers = async (req: Request, res: Response) => {
    try {
        const {groupId, userId} = res.locals;
        const {username} = req.query;

        const response = await getUsersBy(username as string, groupId, userId);

        res.status(200).json({
            success: true,
            response: response ?? []
        });
    } catch (err: any) {
        res.status(500).json({success: false, error: err.message});
    }
}

export const updateNotificationPreference = async (req: Request, res: Response) => {
    try {
        const {id, enabled} = req.query;
        const userId = res.locals.userId;

        await updateGroupNotificationPreference(Number(id), userId, enabled === "true");

        res.status(200).json({
            success: true,
        });
    } catch (err: any) {
        res.status(500).json({success: false, error: err.message});
    }
}
