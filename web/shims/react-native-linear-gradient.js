const React = require('react');
const { View } = require('react-native');

function LinearGradient({ colors = [], start = { x: 0, y: 0 }, end = { x: 1, y: 1 }, style, children, ...rest }) {
  const angleRad = Math.atan2(end.y - start.y, end.x - start.x);
  const angleDeg = angleRad * (180 / Math.PI) + 90;
  const backgroundImage = `linear-gradient(${angleDeg}deg, ${colors.join(', ')})`;

  return React.createElement(
    View,
    { style: [style, { backgroundImage }], ...rest },
    children,
  );
}

module.exports = LinearGradient;
module.exports.default = LinearGradient;
