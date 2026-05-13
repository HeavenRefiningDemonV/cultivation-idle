type StoryCaptionProps = {
  caption: string;
  hidden?: boolean;
};

export function StoryCaption({ caption, hidden = false }: StoryCaptionProps) {
  return (
    <p className={`storyCaption${hidden ? ' storyCaption--hidden' : ''}`} aria-live="polite">
      {caption}
    </p>
  );
}
