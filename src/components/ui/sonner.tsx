"use client"

import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      position="top-right"
      expand={false}
      richColors
      closeButton
      toastOptions={{
        duration: 4000,
        classNames: {
          toast:
            "group toast !rounded-xl !shadow-xl !border !text-sm !font-semibold !px-4 !py-3 !min-h-[52px] !items-start",
          title:
            "!font-bold !text-sm !leading-tight",
          description:
            "!text-xs !font-medium !opacity-80 !mt-0.5",
          success:
            "!bg-emerald-50 !border-emerald-200 !text-emerald-900",
          error:
            "!bg-rose-50 !border-rose-200 !text-rose-900",
          warning:
            "!bg-amber-50 !border-amber-200 !text-amber-900",
          info:
            "!bg-sky-50 !border-sky-200 !text-sky-900",
          closeButton:
            "!border-0 !bg-transparent !opacity-50 hover:!opacity-100",
          actionButton:
            "!bg-neutral-900 !text-white !text-xs !font-bold !rounded-lg !px-3 !py-1.5",
          cancelButton:
            "!bg-neutral-100 !text-neutral-700 !text-xs !font-bold !rounded-lg !px-3 !py-1.5",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
