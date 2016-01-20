import React from 'react';

const LoadingWrapper = React.createClass({
  propTypes: {
    loadingState: React.PropTypes.object.isRequired,
    onRetry: React.PropTypes.func.isRequired,
    children: React.PropTypes.func.isRequired,
    isHydrated: React.PropTypes.bool.isRequired,
  },

  render() {
    if (this.props.loadingState.error) {
      const error = this.props.loadingState.error.message;

      return (
        <div>
          <strong>Error loading</strong>: {error}.{' '}
          <strong>
            <a onClick={this.props.onRetry}>Retry?</a>
          </strong>
        </div>
      );

    } else if (this.props.loading || !this.props.isHydrated) {
      // If the action is loading new data, or if there's nothing hydrated, show loading state
      return (
        <div>
          Loading...
        </div>
      );

    } else {
      return this.props.children();

    }
  }
});

export default LoadingWrapper;
