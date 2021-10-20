import { Types } from 'mongoose';
import loggerFactory from '../../utils/logger';
import { getModelSafely } from '../util/mongoose-utils';
import ActivityDefine from '../util/activityDefine';
import Crowi from '../crowi';

const logger = loggerFactory('growi:service:CommentService');


class CommentService {

  crowi!: Crowi;

  activityService!: any;

  inAppNotificationService!: any;

  commentEvent!: any;

  constructor(crowi: Crowi) {
    this.crowi = crowi;
    this.activityService = crowi.activityService;
    this.inAppNotificationService = crowi.inAppNotificationService;

    this.commentEvent = crowi.event('comment');

    // init
    this.initCommentEventListeners();
  }


  initCommentEventListeners(): void {
    // create
    this.commentEvent.on('create', async(savedComment) => {

      try {
        const Page = getModelSafely('Page') || require('../models/page')(this.crowi);
        await Page.updateCommentCount(savedComment.page);

        await this.createAndSendNotifications(savedComment, ActivityDefine.ACTION_COMMENT_CREATE);
      }
      catch (err) {
        logger.error('Error occurred while handling the comment create event:\n', err);
      }

    });

    // update
    this.commentEvent.on('update', async(updatedComment) => {
      try {
        this.commentEvent.onUpdate();

        await this.createAndSendNotifications(updatedComment, ActivityDefine.ACTION_COMMENT_UPDATE);
      }
      catch (err) {
        logger.error('Error occurred while handling the comment update event:\n', err);
      }

      // TODO: 79713
      // const { inAppNotificationService } = this.crowi;
    });

    // remove
    this.commentEvent.on('remove', async(comment) => {
      this.commentEvent.onRemove();

      try {
        const Page = getModelSafely('Page') || require('../models/page')(this.crowi);
        await Page.updateCommentCount(comment.page);
      }
      catch (err) {
        logger.error('Error occurred while updating the comment count:\n', err);
      }
    });
  }


  createAndSendNotifications = async function(comment, actionType) {
    const parameters = {
      user: comment.creator,
      targetModel: ActivityDefine.MODEL_PAGE,
      target: comment.page,
      eventModel: ActivityDefine.MODEL_COMMENT,
      event: comment._id,
      action: actionType,
    };
    const activity = await this.activityService.createByParameters(parameters);

    let targetUsers: Types.ObjectId[] = [];
    targetUsers = await activity.getNotificationTargetUsers();

    await this.inAppNotificationService.emitSocketIo(targetUsers);
    await this.inAppNotificationService.upsertByActivity(targetUsers, activity);
  };


  /**
   * @param {Comment} comment
   * @param {string} actionType
   * @return {Promise}
   */
  createCommentActivity = function(comment, actionType) {
    const { activityService } = this.crowi;

    const parameters = {
      user: comment.creator,
      targetModel: ActivityDefine.MODEL_PAGE,
      target: comment.page,
      eventModel: ActivityDefine.MODEL_COMMENT,
      event: comment._id,
      action: actionType,
    };

    return activityService.createByParameters(parameters);
  };


}

module.exports = CommentService;
