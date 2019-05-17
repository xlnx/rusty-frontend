export interface Selectable {
    preSelect(): void;
    select(): void;
    unselect(): void;
}