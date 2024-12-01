const Footer = () => {
    return (
      <footer className="bg-black text-white py-12 px-8 border-t">
        {/* Top Section */}
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* About Section */}
          <div>
            <h1 className="text-3xl mb-4">
              Custom Tees Hub - Your Personalized Fashion Studio
            </h1>
            <p className="text-gray-500 text-lg">
              The world of fashion is evolving rapidly, and with the rise of
              customization and personalization, there’s an overwhelming need for
              platforms that empower users to express their unique style. This is
              exactly why <span className="text-[#60E8C8]">Custom Tees Hub</span>{" "}
              was created—a platform designed to revolutionize how you design,
              buy, and wear apparel.
            </p>
          </div>
  
          {/* Why Choose Us Section */}
          <div>
            <h2 className="text-3xl mb-4">Why Choose Us</h2>
            <ul className="text-gray-500 space-y-2 text-lg">
              <li>🎨 Easy-to-use design tools</li>
              <li>🛍️ Virtual try-on for personalized shopping</li>
              <li>🚚 Hassle-free printing and shipping</li>
              <li>💼 Monetize your creativity without risk</li>
              <li>👕 Unique, user-generated designs</li>
            </ul>
          </div>
  
          {/* Contact Section */}
          <div>
            <h2 className="text-3xl mb-4">Contact Us</h2>
            <p className="text-gray-500 text-lg">
              Got questions? Reach out to us anytime!
            </p>
            <ul className="space-y-2 text-gray-500 text-lg">
              <li>📧 Email: support@customtees.com</li>
              <li>📞 Phone: +91-12345-67890</li>
              <li>
                📍 Address: 123 Creative Hub, Fashion Street, Bengaluru, India
              </li>
            </ul>
          </div>
        </div>
  
        {/* Features Section */}
        <div className="max-w-7xl mx-auto py-12">
          <h2 className="text-3xl mb-4 underline underline-offset-2">
            Our Features
          </h2>
          <div className="space-y-8">
            {/* Feature 1 */}
            <div>
              <h3 className="text-2xl mb-2">
                1. Effortless Customization – Design Your Own Style
              </h3>
              <p className="text-gray-500 text-lg">
                Imagine creating a t-shirt that perfectly reflects your
                personality—your favorite quote, an artistic graphic, or even your
                own photography. With our intuitive design tools, you don’t need
                to be a professional designer to bring your ideas to life. Simply
                drag, drop, and customize every aspect of your t-shirt, and see
                your imagination come to life!
              </p>
              <ul className="list-disc list-inside text-gray-500 mt-2 text-lg">
                <li>Choose from a variety of colors, fonts, and templates.</li>
                <li>Upload your own designs or photos.</li>
                <li>Adjust layouts with an easy-to-use editor.</li>
              </ul>
            </div>
  
            {/* Feature 2 */}
            <div>
              <h3 className="text-2xl mb-2">
                2. Virtual Try-On – See It Before You Wear It
              </h3>
              <p className="text-gray-500 text-lg">
                Buying online can often feel like a gamble, but not with{" "}
                <span className="text-[#60E8C8]">Custom Tees Hub! </span>
                Our <span className="text-[#60E8C8]">
                  virtual try-on feature
                </span>{" "}
                lets you see exactly how your design will look on you. Upload your
                picture or use a digital avatar to visualize the fit, style, and
                placement of your design.
              </p>
              <ul className="list-disc list-inside text-gray-500 mt-2 text-lg">
                <li>Build confidence in your design choices.</li>
                <li>Reduce uncertainty and hesitation before purchasing.</li>
                <li>Ensure a perfect fit every time.</li>
              </ul>
            </div>
  
            {/* Feature 3 */}
            <div>
              <h3 className="text-2xl mb-2">
                3. Monetize Your Creativity – Start Selling Without Risk
              </h3>
              <p className="text-gray-500 text-lg">
                For designers, artists, and creative thinkers,{" "}
                <span className="text-[#60E8C8]">Custom Tees Hub</span> is the
                perfect platform to launch your brand. Sell your designs without
                worrying about production, shipping, or inventory management.
              </p>
              <ul className="list-disc list-inside text-gray-500 mt-2 text-lg">
                <li>No upfront investment required.</li>
                <li>Focus solely on creativity while we manage operations.</li>
                <li>Reach a global audience with ease.</li>
              </ul>
            </div>
  
            {/* Feature 4 */}
            <div>
              <h3 className="text-2xl mb-2">
                4. Community Engagement – Collaborate and Inspire
              </h3>
              <p className="text-gray-500 text-lg">
                Our platform fosters a vibrant community of creators and buyers.
                Designers can collaborate, share feedback, and showcase their
                work. Buyers can rate, comment, and even request personalized
                designs.
              </p>
              <ul className="list-disc text-lg list-inside text-gray-500 mt-2">
                <li>Interactive design community.</li>
                <li>Inspire others and get inspired.</li>
                <li>Collaborate with like-minded individuals.</li>
              </ul>
            </div>
          </div>
        </div>
  
        {/* Call to Action */}
        <div className="max-w-7xl mx-auto text-center py-12 border-t border-gray-700">
          <h2 className="text-3xl text-[#60E8C8] mb-4 underline underline-offset-2">
            Ready to Create Something Amazing?
          </h2>
          <p className="text-gray-500 mb-6 text-lg">
            Join <span className="text-[#60E8C8]">Custom Tees Hub</span> today and
            unleash your creativity! Whether you're a designer looking to monetize
            your skills or a customer searching for unique apparel, we’ve got you
            covered.
          </p>
          <button className="px-8 py-3 bg-[#60E8C8] text-black text-lg rounded hover:bg-teal-400 transition">
            Get Started Now
          </button>
        </div>
  
        {/* Bottom Section */}
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center pt-8">
          <p className="text-gray-500 text-md">
            © {new Date().getFullYear()} Custom Tees Hub. All rights reserved.
          </p>
          <div className="flex space-x-4 mt-4 md:mt-0 text-lg">
            <a
              href="#"
              className="text-gray-500 hover:text-[#609de8] transition"
              aria-label="Facebook"
            >
              Facebook
            </a>
            <a
              href="#"
              className="text-gray-500 hover:text-[#79dbff] transition"
              aria-label="Twitter"
            >
              Twitter
            </a>
            <a
              href="#"
              className="text-gray-500 hover:text-[#cf60e8] transition"
              aria-label="Instagram"
            >
              Instagram
            </a>
          </div>
        </div>
      </footer>
    );
  };
  
  export default Footer;
  