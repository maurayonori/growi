import React from 'react';
import PropTypes from 'prop-types';
import { withTranslation } from 'react-i18next';


const PasswordResetExecutionForm = (props) => {
  // TODO: apply i18n by GW-6861
  // const { t } = props;

  return (
    // TODO: improve the form by GW-6852
    <div>
      PasswordResetExecutionForm
    </div>
  );
};

PasswordResetExecutionForm.propTypes = {
  t: PropTypes.func.isRequired, //  i18next
};

export default withTranslation()(PasswordResetExecutionForm);
