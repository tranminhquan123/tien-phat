export function ActionButton(props: { label: string; onPress: () => void }) {
  return <button type="button" onClick={props.onPress}>{props.label}</button>;
}
