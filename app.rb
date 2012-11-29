require "rubygems"
require "bundler/setup"
require "sinatra"
require "yaml"
require "json"
require "uri"
require "net/http"

$LOAD_PATH.unshift(File.expand_path("../", __FILE__))

if File.exists?("./config/config.yml")
  $config = YAML::load_file("./config/config.yml")
else
  $config = {}
end

Dir["./controllers/*.rb"].each {|f| require f}