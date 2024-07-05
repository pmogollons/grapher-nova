import React from "react";

import getDisplayName from "./getDisplayName";


export default function withStaticQueryContainer(config) {
  return function(WrappedComponent) {
    /**
     * We use it like this, so we can have naming inside React Dev Tools
     * This is a standard pattern in HOCs
     */
    class GrapherStaticQueryContainer extends React.Component {
      state = {
        isLoading: true,
        error: null,
        data: [],
      };

      UNSAFE_componentWillReceiveProps(nextProps) {
        let append = false;
        const { query } = nextProps;

        if (this.props.query.params.skip < query.params.skip) {
          append = true;
        }

        if (!config.shouldRefetch) {
          this.fetchAsync(query, append);
        } else if (config.shouldRefetch(this.props, nextProps)) {
          this.fetchAsync(query, append);
        }
      }

      componentDidMount() {
        const { query, config } = this.props;
        this.fetchAsync(query);

        if (config.pollingMs) {
          this.pollingInterval = setInterval(() => {
            this.fetchAsync();
          }, config.pollingMs);
        }
      }

      componentWillUnmount() {
        this.pollingInterval && clearInterval(this.pollingInterval);
      }

      fetchAsync = async (query, append) => {
        if (!query) {
          query = this.props.query;
        }

        try {
          const data = await query.fetchAsync();

          this.setState({
            error: null,
            data: config.appendData && append ? [...this.state.data, ...data] : data,
            isLoading: false,
          });
        } catch (error) {
          this.setState({
            error,
            data: config.appendData && append ? [...this.state.data] : [],
            isLoading: false,
          });
        }
      };

      refetch = () => {
        const { loadOnRefetch = true } = config;
        const { query } = this.props;

        if (loadOnRefetch) {
          this.setState({ isLoading: true }, () => {
            this.fetchAsync(query);
          });
        } else {
          this.fetchAsync(query);
        }
      };

      render() {
        const { config, props, query } = this.props;

        return React.createElement(WrappedComponent, {
          grapher: this.state,
          config,
          query,
          props: { ...props, refetch: this.refetch },
        });
      }
    }

    GrapherStaticQueryContainer.displayName = `StaticQuery(${getDisplayName(
      WrappedComponent,
    )})`;

    return GrapherStaticQueryContainer;
  };
}
