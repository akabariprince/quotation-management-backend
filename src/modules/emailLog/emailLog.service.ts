// src/modules/emailLog/emailLog.service.ts
import { Op, fn, col, literal } from 'sequelize';
import EmailLog from '../../models/EmailLog.model';
import User from '../../models/User.model';
import { parsePagination, buildPaginationMeta } from '../../utils/pagination.utils';

class EmailLogService {
  async findAll(query: any) {
    const pagination = parsePagination(query, 'createdAt', [
      'createdAt', 'recipient', 'type', 'status', 'channel',
    ]);

    const where: any = {};

    if (query.search) {
      where[Op.or] = [
        { recipient: { [Op.iLike]: `%${query.search}%` } },
        { toEmail: { [Op.iLike]: `%${query.search}%` } },
        { toPhone: { [Op.iLike]: `%${query.search}%` } },
        { subject: { [Op.iLike]: `%${query.search}%` } },
      ];
    }
    if (query.channel) where.channel = query.channel;
    if (query.type) where.type = query.type;
    if (query.status) where.status = query.status;
    if (query.startDate && query.endDate) {
      where.createdAt = {
        [Op.between]: [new Date(query.startDate), new Date(query.endDate)],
      };
    }

    const { count, rows } = await EmailLog.findAndCountAll({
      where,
      include: [
        { model: User, as: 'sender', attributes: ['id', 'name', 'email'] },
      ],
      order: [[pagination.sortBy, pagination.sortOrder]],
      limit: pagination.limit,
      offset: pagination.offset,
    });

    return {
      data: rows,
      meta: buildPaginationMeta(count, pagination.page, pagination.limit),
    };
  }

  async getStats() {
    const total = await EmailLog.count();
    const sent = await EmailLog.count({ where: { status: 'sent' } });
    const failed = await EmailLog.count({ where: { status: 'failed' } });

    // Count by type
    const byType = await EmailLog.findAll({
      attributes: [
        'type',
        [fn('COUNT', col('id')), 'count'],
      ],
      group: ['type'],
      raw: true,
    });

    // Today's emails
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayCount = await EmailLog.count({
      where: { createdAt: { [Op.gte]: today } },
    });

    const byChannel = await EmailLog.findAll({
      attributes: [
        'channel',
        [fn('COUNT', col('id')), 'count'],
      ],
      group: ['channel'],
      raw: true,
    });

    return {
      total,
      sent,
      failed,
      todayCount,
      byType,
      byChannel,
    };
  }
}

export const emailLogService = new EmailLogService();
