import React from 'react';
import PropTypes from 'prop-types';
import { withTranslation } from 'react-i18next';

import { withUnstatedContainers } from './UnstatedUtils';
import RevisionCompareContainer from '../services/RevisionCompareContainer';
import RevisionDiff from './PageHistory/RevisionDiff';

import RevisionIdForm from './RevisionCompare/RevisionIdForm';

class PageCompare extends React.Component {
  async componentWillMount() {
    const { revisionCompareContainer } = this.props;
    await revisionCompareContainer.readyRevisions();
  }

  render() {
    const { t, revisionCompareContainer } = this.props;

    const fromRev = revisionCompareContainer.state.fromRevision;
    const toRev = revisionCompareContainer.state.toRevision;
    const showDiff = (fromRev && toRev);

    return (
      <div id="revision-compare-content">
        <div>{ t('page_compare_revision.comparing_changes') }</div>
        <RevisionIdForm />
        <div class="card card-compare">
          <div class="card-body">
          { fromRev && fromRev._id }<i class="icon-arrow-right-circle mx-1"></i>{ toRev && toRev._id }
          </div>
        </div>
        { showDiff &&
          <RevisionDiff
            revisionDiffOpened={ true }
            previousRevision={ fromRev }
            currentRevision={ toRev }
          />
        }
      </div>
    );
  }

}

/**
 * Wrapper component for using unstated
 */
const PageCompareWrapper = withUnstatedContainers(PageCompare, [RevisionCompareContainer]);

PageCompare.propTypes = {
  t: PropTypes.func.isRequired, // i18next
  revisionCompareContainer: PropTypes.instanceOf(RevisionCompareContainer).isRequired,
};

export default withTranslation()(PageCompareWrapper);
