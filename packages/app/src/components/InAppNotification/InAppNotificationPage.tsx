import React, { FC, useState } from 'react';

import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import { useSWRConfig } from 'swr';
import AppContainer from '~/client/services/AppContainer';
import { withUnstatedContainers } from '../UnstatedUtils';
import InAppNotificationList from './InAppNotificationList';
import { useSWRxInAppNotifications } from '../../stores/in-app-notification';
import PaginationWrapper from '../PaginationWrapper';
import CustomNavAndContents from '../CustomNavigation/CustomNavAndContents';
import { InAppNotificationStatuses } from '~/interfaces/in-app-notification';
import { apiv3Put } from '~/client/util/apiv3-client';


type Props = {
  appContainer: AppContainer
}

const InAppNotificationPageBody: FC<Props> = (props) => {
  const { appContainer } = props;
  const limit = appContainer.config.pageLimitationXL;
  const { t } = useTranslation();

  const InAppNotificationCategoryByStatus = (status?: InAppNotificationStatuses) => {
    const [activePage, setActivePage] = useState(1);
    const offset = (activePage - 1) * limit;

    let categoryStatus;

    switch (status) {
      case InAppNotificationStatuses.STATUS_UNOPENED:
        categoryStatus = InAppNotificationStatuses.STATUS_UNOPENED;
        break;
      default:
    }

    const { data: notificationData } = useSWRxInAppNotifications(limit, offset, categoryStatus);
    const { mutate } = useSWRConfig();

    const setAllNotificationPageNumber = (selectedPageNumber): void => {
      setActivePage(selectedPageNumber);
    };


    if (notificationData == null) {
      return (
        <div className="wiki">
          <div className="text-muted text-center">
            <i className="fa fa-2x fa-spinner fa-pulse mr-1"></i>
          </div>
        </div>
      );
    }

    const updateUnopendNotificationStatusesToOpened = async() => {
      await apiv3Put('/in-app-notification/all-statuses-open');
      // mutate notification statuses in 'UNREAD' Category
      mutate(['/in-app-notification/list', limit, offset, categoryStatus]);
      // mutate notification statuses in 'ALL' Category
      mutate(['/in-app-notification/list', limit, offset, undefined]);
    };


    return (
      <>
        {(status === InAppNotificationStatuses.STATUS_UNOPENED && notificationData.totalDocs > 0)
      && (
        <div className="mb-2 d-flex justify-content-end">
          <button
            type="button"
            className="btn btn-outline-primary"
            onClick={updateUnopendNotificationStatusesToOpened}
          >
            {t('in_app_notification.mark_all_as_read')}
          </button>
        </div>
      )}
        <InAppNotificationList inAppNotificationData={notificationData} />

        {notificationData.totalDocs > 0
          && (
            <PaginationWrapper
              activePage={activePage}
              changePage={setAllNotificationPageNumber}
              totalItemsCount={notificationData.totalDocs}
              pagingLimit={notificationData.limit}
              align="center"
              size="sm"
            />
          )
        }
      </>
    );
  };

  const navTabMapping = {
    user_infomation: {
      Icon: () => <></>,
      Content: () => InAppNotificationCategoryByStatus(),
      i18n: t('in_app_notification.all'),
      index: 0,
    },
    external_accounts: {
      Icon: () => <></>,
      Content: () => InAppNotificationCategoryByStatus(InAppNotificationStatuses.STATUS_UNOPENED),
      i18n: t('in_app_notification.unopend'),
      index: 1,
    },
  };

  return (
    <CustomNavAndContents navTabMapping={navTabMapping} />
  );
};

const InAppNotificationPage = withUnstatedContainers(InAppNotificationPageBody, [AppContainer]);
export default InAppNotificationPage;

InAppNotificationPageBody.propTypes = {
  appContainer: PropTypes.instanceOf(AppContainer).isRequired,
};
