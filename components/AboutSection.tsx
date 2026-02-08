import { Heart, Leaf, Clock, MapPin } from "lucide-react";

export default function AboutSection() {
  const features = [
    {
      icon: Heart,
      title: "Made with Love",
      description: "Every batch is handcrafted with care using premium ingredients.",
    },
    {
      icon: Leaf,
      title: "Quality Ingredients",
      description: "We use only the finest butter, chocolate, and fresh ingredients.",
    },
    {
      icon: Clock,
      title: "Fresh or Frozen",
      description: "Enjoy fresh-baked cookies or bake at home with our frozen dough.",
    },
    {
      icon: MapPin,
      title: "Local Business",
      description: "Proudly serving Johns Creek and Metro Atlanta communities.",
    },
  ];

  return (
    <section id="about" className="py-16 bg-white">
      <div className="container-custom">
        <div className="text-center mb-12">
          <h2 className="section-heading">About Jen&apos;s Gourmet Bites</h2>
          <p className="text-primary-600 max-w-3xl mx-auto leading-relaxed">
            What started as a passion for baking in my Johns Creek kitchen has grown
            into a labor of love that I&apos;m thrilled to share with you. Each cookie
            is made from scratch using family recipes and the finest ingredients,
            because you deserve nothing less than the best.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="text-center p-6 rounded-xl bg-cream hover:shadow-md transition-shadow"
            >
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary-100 text-primary mb-4">
                <feature.icon className="w-7 h-7" />
              </div>
              <h3 className="font-display text-lg text-primary mb-2">
                {feature.title}
              </h3>
              <p className="text-primary-600 text-sm">{feature.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 bg-primary-50 rounded-2xl p-8 md:p-12">
          <div className="max-w-3xl mx-auto text-center">
            <h3 className="font-display text-2xl text-primary mb-4">
              Serving Metro Atlanta
            </h3>
            <p className="text-primary-700 leading-relaxed">
              Based in Johns Creek, Georgia, we&apos;re proud to serve cookie lovers
              throughout Metro Atlanta. Whether you&apos;re planning a special event,
              looking for the perfect gift, or simply treating yourself, our gourmet
              cookies are sure to delight. Local pickup available, and we can arrange
              delivery for larger orders.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
