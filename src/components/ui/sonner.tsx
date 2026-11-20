import { Toaster as Sonner } from "sonner";
import { CircleCheck, CircleAlert, TriangleAlert, Info, Loader2 } from "lucide-react";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      position="top-center"
      duration={3500}
      icons={{
        success: <CircleCheck className="h-5 w-5" />,
        error: <CircleAlert className="h-5 w-5" />,
        warning: <TriangleAlert className="h-5 w-5" />,
        info: <Info className="h-5 w-5" />,
        loading: <Loader2 className="h-5 w-5 animate-spin" />,
      }}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast: "game-toast",
          title: "game-toast-title",
          description: "game-toast-description",
          icon: "game-toast-icon",
          actionButton: "game-toast-action",
          cancelButton: "game-toast-cancel",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
