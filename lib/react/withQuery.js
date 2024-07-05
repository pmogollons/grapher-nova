import React from "react";

import defaults from "./defaults";
import checkOptions from "./checkOptions";
import withStaticQuery from "./withStaticQuery";
import withQueryContainer from "./withQueryContainer";


export default function withQuery(handler, _config = {}) {
  checkOptions(_config);
  const config = Object.assign({}, defaults, _config);

  return function(component) {
    const queryContainer = withQueryContainer(component);
    const staticQueryContainer = withStaticQuery(config)(
      queryContainer,
    );

    // eslint-disable-next-line react/display-name
    return React.memo(function(props) {
      const query = handler(props);

      return React.createElement(staticQueryContainer, {
        query,
        props,
        config,
      });
    });
  };
}
