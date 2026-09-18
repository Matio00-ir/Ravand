import { useTranslations } from "next-intl";
import { Zone, SectionHead } from "@/components/system/Zone";
import { Reveal } from "@/components/system/Reveal";
import { Marquee } from "@/components/ui/Marquee";

type Testimonial = { quote: string; name: string; role: string };

/**
 * Two hairline-bordered rows drifting in opposite directions — voices
 * from the platform, placed between the interactive configurator and
 * the industries index as a beat of proof before the next claim.
 */
export function Testimonials() {
  const t = useTranslations("testimonials");
  const items = t.raw("items") as Testimonial[];
  const firstRow = items.slice(0, Math.ceil(items.length / 2));
  const secondRow = items.slice(Math.ceil(items.length / 2));

  return (
    <Zone tone="light" id="testimonials">
      <div className="shell zone">
        <SectionHead label={t("label")} title={t("title")} lead={t("lead")} />
      </div>

      <Reveal className="relative mt-14 md:mt-16">
        <Marquee pauseOnHover duration={44}>
          {firstRow.map((item) => (
            <TestimonialCard key={item.name} {...item} />
          ))}
        </Marquee>
        <Marquee reverse pauseOnHover duration={44} className="mt-4">
          {secondRow.map((item) => (
            <TestimonialCard key={item.name} {...item} />
          ))}
        </Marquee>

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 start-0 w-16 bg-gradient-to-r from-page to-transparent sm:w-32"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 end-0 w-16 bg-gradient-to-l from-page to-transparent sm:w-32"
        />
      </Reveal>
    </Zone>
  );
}

function TestimonialCard({ quote, name, role }: Testimonial) {
  return (
    <figure className="panel flex w-[300px] shrink-0 flex-col justify-between p-6 sm:w-[360px]">
      <blockquote className="t-body text-ink">{quote}</blockquote>
      <figcaption className="mt-6 border-t border-line pt-4">
        <p className="t-small font-semibold text-ink">{name}</p>
        <p className="t-small mt-0.5 text-ink-muted">{role}</p>
      </figcaption>
    </figure>
  );
}
