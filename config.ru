require File.expand_path("../app.rb", __FILE__)

use Rack::CommonLogger, $stdout
run Sinatra::Application