import React, { Component } from "react";
import { Animated, ImageProps } from "react-native";
let Value = Animated.Value;

var IState = {
  opacity: Value
};

export class Logo extends Component {
  constructor() {
    state = {
      opacity: new Animated.Value(1)
    };
  }
  componentDidMount() {
    console.log("RUNNING ON LOAD");
    console.log("-> ", this.state);
    Animated.loop(
      Animated.sequence([
        Animated.timing(this.state.opacity, {
          toValue: 0,
          duration: 500,
          delay: 1000,
          useNativeDriver: true
        }),
        Animated.timing(this.state.opacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true
        })
      ])
    ).start();
  }

  render() {
    return (
      <Animated.Image
        onLoad={this.onLoad}
        source={this.props.source}
        style={[{ opacity: this.state.opacity }, this.props.style]}
      />
    );
  }
}
