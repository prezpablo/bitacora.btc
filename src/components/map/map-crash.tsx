import { Component, type ReactNode } from "react";

/** WebGL / chunk del globo no puede dejar el mapa en blanco. */
export class MapCrash extends Component<{ fallback: ReactNode; children: ReactNode }, { err: boolean }> {
  state = { err: false };
  static getDerivedStateFromError() {
    return { err: true };
  }
  render() {
    return this.state.err ? this.props.fallback : this.props.children;
  }
}
