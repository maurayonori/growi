import React from 'react';
import PropTypes from 'prop-types';
import loggerFactory from '~/utils/logger';

import { withUnstatedContainers } from './UnstatedUtils';
import AppContainer from '~/client/services/AppContainer';
import PageContainer from '~/client/services/PageContainer';
import EditorContainer from '~/client/services/EditorContainer';

import MarkdownTable from '~/client/models/MarkdownTable';

import LinkEditModal from './PageEditor/LinkEditModal';
import RevisionRenderer from './Page/RevisionRenderer';
import GridEditModal from './PageEditor/GridEditModal';
import HandsontableModal from './PageEditor/HandsontableModal';
import DrawioModal from './PageEditor/DrawioModal';
import mtu from './PageEditor/MarkdownTableUtil';
import mdu from './PageEditor/MarkdownDrawioUtil';

import { getOptionsToSave } from '~/client/util/editor';

// TODO: remove this when omitting unstated is completed
import {
  useEditorMode, useSelectedGrant, useSelectedGrantGroupId, useSelectedGrantGroupName,
} from '~/stores/ui';
import { useIsSlackEnabled } from '~/stores/editor';
import { useSlackChannels } from '~/stores/context';

const logger = loggerFactory('growi:Page');

class Page extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      currentTargetTableArea: null,
      currentTargetDrawioArea: null,
    };

    this.growiRenderer = this.props.appContainer.getRenderer('page');

    this.gridEditModal = React.createRef();
    this.linkEditModal = React.createRef();
    this.handsontableModal = React.createRef();
    this.drawioModal = React.createRef();

    this.saveHandlerForHandsontableModal = this.saveHandlerForHandsontableModal.bind(this);
    this.saveHandlerForDrawioModal = this.saveHandlerForDrawioModal.bind(this);
  }

  componentWillMount() {
    this.props.appContainer.registerComponentInstance('Page', this);
  }

  /**
   * launch HandsontableModal with data specified by arguments
   * @param beginLineNumber
   * @param endLineNumber
   */
  launchHandsontableModal(beginLineNumber, endLineNumber) {
    const markdown = this.props.pageContainer.state.markdown;
    const tableLines = markdown.split(/\r\n|\r|\n/).slice(beginLineNumber - 1, endLineNumber).join('\n');
    this.setState({ currentTargetTableArea: { beginLineNumber, endLineNumber } });
    this.handsontableModal.current.show(MarkdownTable.fromMarkdownString(tableLines));
  }

  /**
   * launch DrawioModal with data specified by arguments
   * @param beginLineNumber
   * @param endLineNumber
   */
  launchDrawioModal(beginLineNumber, endLineNumber) {
    const markdown = this.props.pageContainer.state.markdown;
    const drawioMarkdownArray = markdown.split(/\r\n|\r|\n/).slice(beginLineNumber - 1, endLineNumber);
    const drawioData = drawioMarkdownArray.slice(1, drawioMarkdownArray.length - 1).join('\n').trim();
    this.setState({ currentTargetDrawioArea: { beginLineNumber, endLineNumber } });
    this.drawioModal.current.show(drawioData);
  }

  async saveHandlerForHandsontableModal(markdownTable) {
    const {
      isSlackEnabled, slackChannels, pageContainer, editorContainer, grant, grantGroupId, grantGroupName,
    } = this.props;
    const optionsToSave = getOptionsToSave(isSlackEnabled, slackChannels, grant, grantGroupId, grantGroupName, editorContainer);

    const newMarkdown = mtu.replaceMarkdownTableInMarkdown(
      markdownTable,
      this.props.pageContainer.state.markdown,
      this.state.currentTargetTableArea.beginLineNumber,
      this.state.currentTargetTableArea.endLineNumber,
    );

    try {
      // disable unsaved warning
      editorContainer.disableUnsavedWarning();

      // eslint-disable-next-line no-unused-vars
      const { page, tags } = await pageContainer.save(newMarkdown, this.props.editorMode, optionsToSave);
      logger.debug('success to save');

      pageContainer.showSuccessToastr();
    }
    catch (error) {
      logger.error('failed to save', error);
      pageContainer.showErrorToastr(error);
    }
    finally {
      this.setState({ currentTargetTableArea: null });
    }
  }

  async saveHandlerForDrawioModal(drawioData) {
    const {
      isSlackEnabled, slackChannels, pageContainer, editorContainer, grant, grantGroupId, grantGroupName,
    } = this.props;
    const optionsToSave = getOptionsToSave(isSlackEnabled, slackChannels, grant, grantGroupId, grantGroupName, editorContainer);

    const newMarkdown = mdu.replaceDrawioInMarkdown(
      drawioData,
      this.props.pageContainer.state.markdown,
      this.state.currentTargetDrawioArea.beginLineNumber,
      this.state.currentTargetDrawioArea.endLineNumber,
    );

    try {
      // disable unsaved warning
      editorContainer.disableUnsavedWarning();

      // eslint-disable-next-line no-unused-vars
      const { page, tags } = await pageContainer.save(newMarkdown, this.props.editorMode, optionsToSave);
      logger.debug('success to save');

      pageContainer.showSuccessToastr();
    }
    catch (error) {
      logger.error('failed to save', error);
      pageContainer.showErrorToastr(error);
    }
    finally {
      this.setState({ currentTargetDrawioArea: null });
    }
  }

  render() {
    const { appContainer, pageContainer } = this.props;
    const { isMobile } = appContainer;
    const isLoggedIn = appContainer.currentUser != null;
    const { markdown } = pageContainer.state;

    return (
      <div className={`mb-5 ${isMobile ? 'page-mobile' : ''}`}>
        <RevisionRenderer growiRenderer={this.growiRenderer} markdown={markdown} />

        { isLoggedIn && (
          <>
            <GridEditModal ref={this.gridEditModal} />
            <LinkEditModal ref={this.LinkEditModal} />
            <HandsontableModal ref={this.handsontableModal} onSave={this.saveHandlerForHandsontableModal} />
            <DrawioModal ref={this.drawioModal} onSave={this.saveHandlerForDrawioModal} />
          </>
        )}
      </div>
    );
  }

}

Page.propTypes = {
  appContainer: PropTypes.instanceOf(AppContainer).isRequired,
  pageContainer: PropTypes.instanceOf(PageContainer).isRequired,
  editorContainer: PropTypes.instanceOf(EditorContainer).isRequired,

  // TODO: remove this when omitting unstated is completed
  editorMode: PropTypes.string.isRequired,
  isSlackEnabled: PropTypes.bool.isRequired,
  slackChannels: PropTypes.string.isRequired,
  grant: PropTypes.number.isRequired,
  grantGroupId: PropTypes.string,
  grantGroupName: PropTypes.string,
};

const PageWrapper = (props) => {
  const { data: editorMode } = useEditorMode();
  const { data: isSlackEnabled } = useIsSlackEnabled();
  const { data: slackChannels } = useSlackChannels();
  const { data: grant } = useSelectedGrant();
  const { data: grantGroupId } = useSelectedGrantGroupId();
  const { data: grantGroupName } = useSelectedGrantGroupName();


  if (editorMode == null) {
    return null;
  }

  return (
    <Page
      {...props}
      editorMode={editorMode}
      isSlackEnabled={isSlackEnabled}
      slackChannels={slackChannels}
      grant={grant}
      grantGroupId={grantGroupId}
      grantGroupName={grantGroupName}
    />
  );
};

export default withUnstatedContainers(PageWrapper, [AppContainer, PageContainer, EditorContainer]);
